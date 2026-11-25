import assert from 'node:assert/strict';
import test from 'node:test';
import imageProxyHandler from '../image-proxy';
import resolveLinkHandler from '../resolve-link';
import searchHandler from '../search';
import type { ApiRequest, ApiResponse } from './http';
import { applyRateLimit, resetRateLimiterForTests } from './rateLimit';
import {
  assertPublicDns,
  isAllowlistedImageHost,
  isBlockedIp,
  ProxyHttpError,
  safeFetchAllowlistedImage,
  validateExternalImageUrl,
} from './security';

function createMockRes() {
  const headers = new Map<string, string | string[]>();
  let body: Buffer | string | undefined;
  const res: ApiResponse = {
    statusCode: 200,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    end(chunk) {
      if (chunk !== undefined) {
        body = chunk as Buffer | string;
      }
    },
  };
  return {
    res,
    headers,
    getBodyText: () =>
      Buffer.isBuffer(body) ? body.toString('utf8') : typeof body === 'string' ? body : '',
  };
}

function createMockReq(url: string, ip = '203.0.113.50'): ApiRequest {
  return {
    method: 'GET',
    url,
    headers: {
      'x-forwarded-for': ip,
    },
  };
}

test('isAllowlistedImageHost enforces exact CDN allowlist and rejects lookalikes', () => {
  assert.equal(isAllowlistedImageHost('is1-ssl.mzstatic.com'), true);
  assert.equal(isAllowlistedImageHost('is5.mzstatic.com'), true);
  assert.equal(isAllowlistedImageHost('i.scdn.co'), true);
  assert.equal(isAllowlistedImageHost('scannables.scdn.co'), true);
  assert.equal(isAllowlistedImageHost('mosaic.scdn.co'), true);

  assert.equal(isAllowlistedImageHost('evil.com'), false);
  assert.equal(isAllowlistedImageHost('is1-ssl.mzstatic.com.evil.com'), false);
  assert.equal(isAllowlistedImageHost('sub.i.scdn.co'), false);
  assert.equal(isAllowlistedImageHost('open.spotify.com'), false);
  assert.equal(isAllowlistedImageHost('is1-ssl.mzstatic.com.'), false);
  assert.equal(isAllowlistedImageHost(''), false);
});

test('isBlockedIp blocks loopback, private, link-local, metadata, and IPv4-mapped ranges', () => {
  const blocked = [
    '127.0.0.1',
    '127.255.255.254',
    '10.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.10',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '::1',
    '::',
    'fc00::1',
    'fd12:3456:789a::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:169.254.169.254',
    'not-an-ip',
  ];
  for (const ip of blocked) {
    assert.equal(isBlockedIp(ip), true, `Expected ${ip} to be blocked`);
  }

  const allowed = ['17.253.144.10', '151.101.1.69', '2606:4700:4700::1111'];
  for (const ip of allowed) {
    assert.equal(isBlockedIp(ip), false, `Expected ${ip} to be allowed`);
  }
});

test('validateExternalImageUrl requires HTTPS, no credentials, no custom port, no IP literal, and allowlisted host', () => {
  assert.ok(validateExternalImageUrl('https://is1-ssl.mzstatic.com/image/thumb/cover.jpg'));
  assert.throws(() => validateExternalImageUrl('http://i.scdn.co/cover.jpg'), ProxyHttpError);
  assert.throws(() => validateExternalImageUrl('https://user:pass@i.scdn.co/cover.jpg'), ProxyHttpError);
  assert.throws(() => validateExternalImageUrl('https://i.scdn.co:8443/cover.jpg'), ProxyHttpError);
  assert.throws(() => validateExternalImageUrl('https://127.0.0.1/cover.jpg'), ProxyHttpError);
  assert.throws(() => validateExternalImageUrl('https://[::1]/cover.jpg'), ProxyHttpError);
  assert.throws(() => validateExternalImageUrl('https://evil.com/cover.jpg'), ProxyHttpError);
});

test('assertPublicDns rejects private DNS resolution before fetching', async () => {
  await assert.rejects(
    () =>
      assertPublicDns('i.scdn.co', async () => [{ address: '169.254.169.254', family: 4 }]),
    (err: unknown) => err instanceof ProxyHttpError && err.statusCode === 400,
  );

  await assert.doesNotReject(() =>
    assertPublicDns('i.scdn.co', async () => [{ address: '151.101.1.69', family: 4 }]),
  );
});

test('safeFetchAllowlistedImage blocks non-allowlisted redirects, non-image content-type, and >10MB streams', async () => {
  const publicLookup = async () => [{ address: '151.101.1.69', family: 4 }];

  // 1. Redirect to disallowed host must fail with 400 without following
  let fetchCalls = 0;
  await assert.rejects(
    () =>
      safeFetchAllowlistedImage('https://i.scdn.co/image/abc', {
        lookupFn: publicLookup,
        fetchFn: (async () => {
          fetchCalls += 1;
          return new Response(null, {
            status: 302,
            headers: { location: 'https://evil.com/steal.png' },
          });
        }) as typeof fetch,
      }),
    (err: unknown) => err instanceof ProxyHttpError && err.statusCode === 400,
  );
  assert.equal(fetchCalls, 1);

  // 2. Non-image Content-Type rejected with 400
  await assert.rejects(
    () =>
      safeFetchAllowlistedImage('https://i.scdn.co/image/abc', {
        lookupFn: publicLookup,
        fetchFn: (async () =>
          new Response('<html>nope</html>', {
            status: 200,
            headers: { 'content-type': 'text/html' },
          })) as typeof fetch,
      }),
    (err: unknown) => err instanceof ProxyHttpError && err.statusCode === 400,
  );

  // 3. Stream exceeding size cap rejected with 413
  await assert.rejects(
    () =>
      safeFetchAllowlistedImage('https://i.scdn.co/image/abc', {
        lookupFn: publicLookup,
        maxBytes: 1024,
        fetchFn: (async () =>
          new Response(new Uint8Array(2048), {
            status: 200,
            headers: { 'content-type': 'image/png' },
          })) as typeof fetch,
      }),
    (err: unknown) => err instanceof ProxyHttpError && err.statusCode === 413,
  );

  // 4. Valid allowlisted redirect followed when target is also allowlisted
  const okResult = await safeFetchAllowlistedImage('https://i.scdn.co/image/abc', {
    lookupFn: publicLookup,
    fetchFn: (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/abc')) {
        return new Response(null, {
          status: 302,
          headers: { location: 'https://mosaic.scdn.co/640/def' },
        });
      }
      return new Response(Uint8Array.from([137, 80, 78, 71]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      });
    }) as typeof fetch,
  });
  assert.equal(okResult.contentType, 'image/png');
  assert.equal(okResult.buffer.length, 4);
});

test('image-proxy, search, and resolve-link handlers enforce validation and rate limiting', async () => {
  resetRateLimiterForTests();

  // Bad image-proxy URLs -> 400 + CORS header
  for (const badUrl of [
    'http://127.0.0.1/x.png',
    'https://169.254.169.254/latest/meta-data',
    'https://evil.com/x.png',
    'http://i.scdn.co/x.png',
  ]) {
    const mock = createMockRes();
    await imageProxyHandler(
      createMockReq(`/api/image-proxy?url=${encodeURIComponent(badUrl)}`),
      mock.res,
    );
    assert.equal(mock.res.statusCode, 400);
    assert.equal(mock.headers.get('access-control-allow-origin'), '*');
  }

  // Empty search query -> 400
  const searchMock = createMockRes();
  await searchHandler(createMockReq('/api/search?q='), searchMock.res);
  assert.equal(searchMock.res.statusCode, 400);

  // Invalid resolve-link URL -> 400
  const resolveMock = createMockRes();
  await resolveLinkHandler(
    createMockReq('/api/resolve-link?url=https://evil.com/track/4uLU6hMCjMI75M1A2tKUQC'),
    resolveMock.res,
  );
  assert.equal(resolveMock.res.statusCode, 400);

  // Rate limiter returns 429 after limit exceeded
  resetRateLimiterForTests();
  const ip = '198.51.100.42';
  for (let i = 0; i < 3; i += 1) {
    const okMock = createMockRes();
    const allowed = applyRateLimit(createMockReq('/api/search?q=test', ip), okMock.res, {
      route: 'test-route',
      limit: 3,
      windowMs: 60_000,
    });
    assert.equal(allowed, true);
  }
  const blockedMock = createMockRes();
  const allowedFourth = applyRateLimit(createMockReq('/api/search?q=test', ip), blockedMock.res, {
    route: 'test-route',
    limit: 3,
    windowMs: 60_000,
  });
  assert.equal(allowedFourth, false);
  assert.equal(blockedMock.res.statusCode, 429);
  assert.ok(blockedMock.headers.get('retry-after'));
});
