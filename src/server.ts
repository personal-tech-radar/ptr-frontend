import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const backendUrl = process.env['PTR_BACKEND_URL'] ?? 'http://127.0.0.1:3300';
const publicApiKey = process.env['PTR_BACKEND_API_KEY'];

app.use(express.json());

async function proxy(req: express.Request, res: express.Response, target: string, apiKey?: string) {
  const headers: Record<string, string> = { accept: 'application/json' };
  const authorization = req.header('authorization');
  if (authorization) headers['authorization'] = authorization;
  if (apiKey) headers['x-api-key'] = apiKey;
  if (req.method !== 'GET' && req.method !== 'HEAD') headers['content-type'] = 'application/json';

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body),
      redirect: 'manual',
    });
    const location = response.headers.get('location');
    if (location && response.status >= 300 && response.status < 400) {
      res.redirect(response.status, location);
      return;
    }
    const body = await response.text();
    res
      .status(response.status)
      .type(response.headers.get('content-type') ?? 'application/json')
      .send(body);
  } catch {
    res.status(502).json({ statusCode: 502, message: 'The service is temporarily unavailable.' });
  }
}

app.all('/api/backend/{*path}', (req, res) => {
  const path = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
  if (!path || path.startsWith('admin/')) {
    res.status(404).json({ statusCode: 404, message: 'Not found' });
    return;
  }
  void proxy(
    req,
    res,
    `${backendUrl}/${path}${req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''}`,
  );
});

app.all('/api/public/{*path}', (req, res) => {
  const path = Array.isArray(req.params.path) ? req.params.path.join('/') : (req.params.path ?? '');
  if (path === 'feed/preview') {
    void proxy(req, res, `${backendUrl}/public/feed/preview`);
    return;
  }
  if (!publicApiKey) {
    res.status(503).json({ statusCode: 503, message: 'Public API access is not configured.' });
    return;
  }
  const upstream = path.startsWith('signals/') ? `articles/${path.slice(8)}` : path;
  void proxy(
    req,
    res,
    `${backendUrl}/${upstream}${req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''}`,
    publicApiKey,
  );
});

app.get('/go/articles/:id', (req, res) => {
  void proxy(req, res, `${backendUrl}/go/articles/${req.params.id}`);
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] ?? 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
