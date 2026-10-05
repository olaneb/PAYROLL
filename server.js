'use strict';
/* Entry point for local use, Docker and Fly.io. Listens on PORT (default 4070). */
process.removeAllListeners('warning');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { handle, SEC_HEADERS, BODY_LIMIT, storage } = require('./lib/app');

const PORT = Number(process.env.PORT || 4070);
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };

// Front-end files: from the public/ folder, or embedded in the single-file build (dist/server.js).
const EMBEDDED = global.__PAYCORE_ASSETS || null;
function staticFile(pathname) {
  let rel = '';
  try { rel = decodeURIComponent(pathname).replace(/^\/+/, ''); } catch { /* bad URL → index */ }
  if (EMBEDDED) { const name = Object.prototype.hasOwnProperty.call(EMBEDDED, rel) ? rel : 'index.html'; return { name, body: EMBEDDED[name] }; }
  let p = path.normalize(path.join(PUBLIC, rel));
  if (!p.startsWith(PUBLIC) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(PUBLIC, 'index.html');
  return { name: p, body: fs.readFileSync(p) };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) {
    const f = staticFile(url.pathname);
    res.writeHead(200, { ...SEC_HEADERS, 'Content-Type': MIME[path.extname(f.name)] || 'application/octet-stream', 'Cache-Control': f.name.endsWith('.html') ? 'no-store' : 'public, max-age=300' });
    return res.end(f.body);
  }
  const chunks = []; let size = 0, aborted = false;
  req.on('data', c => { size += c.length; if (size > BODY_LIMIT) { aborted = true; res.writeHead(413, { 'Content-Type': 'application/json' }); res.end('{"error":"Upload is too large"}'); req.destroy(); } else chunks.push(c); });
  req.on('end', async () => {
    if (aborted) return;
    const out = await handle({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks), ip: req.socket.remoteAddress });
    res.writeHead(out.status, out.headers); res.end(out.body);
  });
});
server.listen(PORT, '0.0.0.0', () => console.log(`PayCore HR running on http://localhost:${PORT} (storage: ${storage})`));

// Fly.io sends SIGINT/SIGTERM before stopping a machine: finish requests and close the database cleanly.
function shutdown(sig) {
  console.log(`${sig} received — shutting down`);
  server.close(() => { try { require('./lib/db').driver && require('./lib/db').driver.close(); } catch { /* ignore */ } process.exit(0); });
  if (server.closeIdleConnections) server.closeIdleConnections();
  setTimeout(() => process.exit(0), 8000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
module.exports = server;
