/**
 * LOCAL DEVELOPMENT SERVER — started by npm start.
 * Uses Node's built-in modules, so no dependency installation is required to run it.
 * Serves this project on your own computer only. Stop it with Ctrl+C.
 * This is not a production backend and does not process checkout data.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve relative to this script on Windows, macOS, and Linux.
const rootPath = resolve(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.argv[2] || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Choose a port from 1 to 65535, for example: npm start -- 8081');
  process.exit(1);
}

// Browsers require the right MIME type for JavaScript modules and image/font files.
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
};
const pageFiles = new Set(['index.html', 'styles.css', 'fonts.css', 'app.js', 'catalogue.js']);

/** Map a request to a public site file; reject paths outside the website. */
function resolvePublicFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const segments = relativePath.split('/');
  // Only page files and asset/data directories are needed by the browser.
  const isPublic =
    pageFiles.has(relativePath) ||
    relativePath.startsWith('assets/') ||
    relativePath.startsWith('data/');
  if (!isPublic || relativePath.includes('\\') || segments.some((part) => part.startsWith('.'))) {
    return null;
  }
  const absolutePath = resolve(rootPath, relativePath);
  if (!absolutePath.startsWith(rootPath + sep)) return null;
  return absolutePath;
}

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('This preview serves files only.');
    return;
  }
  try {
    const file = resolvePublicFile(request.url);
    if (!file) {
      response.writeHead(404);
      response.end('File not found.');
      return;
    }
    const contents = await readFile(file);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store', // Browser refreshes show saved edits immediately.
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    const status = error instanceof URIError ? 400 : 404;
    response.writeHead(status);
    response.end(status === 400 ? 'Invalid URL.' : 'File not found.');
  }
});
server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${port} is busy. Try: npm start -- ${port + 1}`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`AURÉL is ready at http://127.0.0.1:${port}`);
  console.log('Refresh your browser after editing files. Press Ctrl+C to stop.');
});
