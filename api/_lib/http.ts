export interface ApiRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
}

export interface ApiResponse {
  statusCode: number;
  setHeader(name: string, value: string | string[]): unknown;
  end(chunk?: unknown): unknown;
}

export function getQueryParam(req: ApiRequest, key: string): string {
  const fromQuery = req.query?.[key];
  if (typeof fromQuery === 'string') {
    return fromQuery;
  }
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === 'string') {
    return fromQuery[0];
  }

  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    return parsed.searchParams.get(key) ?? '';
  } catch {
    return '';
  }
}

export function getClientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  } else if (Array.isArray(forwarded) && forwarded[0]) {
    const first = forwarded[0].split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

export function applyCorsHeaders(
  res: ApiResponse,
  methods = 'GET, HEAD, OPTIONS',
): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function sendJson(
  res: ApiResponse,
  statusCode: number,
  payload: unknown,
  headers?: Record<string, string>,
): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      res.setHeader(k, v);
    }
  }
  res.end(JSON.stringify(payload));
}

export function sendBytes(
  res: ApiResponse,
  statusCode: number,
  body: Buffer,
  contentType: string,
  headers?: Record<string, string>,
  headOnly = false,
): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', String(body.length));
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      res.setHeader(k, v);
    }
  }
  res.end(headOnly ? undefined : body);
}
