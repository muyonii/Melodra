import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

const API_ROUTE_MODULES: Record<string, string> = {
  '/api/image-proxy': '/api/image-proxy.ts',
  '/api/search': '/api/search.ts',
  '/api/resolve-link': '/api/resolve-link.ts',
};

function melodraApiDevPlugin(vercelDevUrl?: string): Plugin {
  return {
    name: 'melodra-api-dev-middleware',
    apply: 'serve',
    configureServer(server) {
      // When VERCEL_DEV_URL is configured (e.g. `vercel dev` on port 3001), Vite's
      // built-in `server.proxy` forwards `/api` requests there instead.
      if (vercelDevUrl) {
        return;
      }
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '/';
        const pathname = rawUrl.split('?')[0];
        const modulePath = API_ROUTE_MODULES[pathname];
        if (!modulePath) {
          next();
          return;
        }
        try {
          const mod = await server.ssrLoadModule(modulePath);
          if (typeof mod.default !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'API handler default export missing.'}));
            return;
          }
          await mod.default(req, res);
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'Local API middleware execution failed.'}));
          }
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const vercelDevUrl = process.env.VERCEL_DEV_URL || env.VERCEL_DEV_URL || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      melodraApiDevPlugin(vercelDevUrl || undefined),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: vercelDevUrl
        ? {
            '/api': {
              target: vercelDevUrl,
              changeOrigin: true,
            },
          }
        : undefined,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
