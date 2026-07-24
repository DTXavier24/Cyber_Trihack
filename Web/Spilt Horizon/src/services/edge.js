'use strict';

const http = require('http');
const crypto = require('crypto');

const EDGE_HOST = process.env.EDGE_HOST || process.env.HOST || '127.0.0.1';
const EDGE_PORT = Number(process.env.EDGE_PORT || 3000);
const ORIGIN_HOST = process.env.ORIGIN_HOST || '127.0.0.1';
const ORIGIN_PORT = Number(process.env.ORIGIN_PORT || 4001);
const ADMIN_COOKIE = process.env.ADMIN_COOKIE || 'dev-admin-cookie';
const EDGE_SEAL_SECRET = process.env.EDGE_SEAL_SECRET || 'dev-edge-seal-secret';

const cache = new Map();
const MAX_BODY = 1024 * 1024;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hmac(value) {
  return crypto.createHmac('sha256', EDGE_SEAL_SECRET).update(value).digest('hex');
}

function decodeOnce(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function collapseSlashes(value) {
  return value.replace(/\/{2,}/g, '/');
}

function removeDotSegments(pathname) {
  const output = [];
  for (const segment of pathname.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') output.pop();
    else output.push(segment);
  }
  return '/' + output.join('/');
}

function canonicalCachePath(rawUrl) {
  const url = new URL(rawUrl, 'http://edge.local');
  let pathname = decodeOnce(url.pathname);
  pathname = collapseSlashes(pathname);

  const nextData = pathname.match(/^\/_next\/data\/[^/]+(\/.*)\.json$/);
  if (nextData) pathname = nextData[1];

  pathname = pathname.replace(/\/\((?:admin|internal|preview)\)(?=\/|$)/g, '');
  pathname = removeDotSegments(pathname);
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');

  return pathname || '/';
}

function visibleRoutePath(rawUrl) {
  const url = new URL(rawUrl, 'http://edge.local');
  let pathname = decodeOnce(url.pathname);
  pathname = collapseSlashes(pathname);
  pathname = removeDotSegments(pathname);
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return pathname || '/';
}

function hasAdminCookie(req) {
  const cookie = req.headers.cookie || '';
  return cookie.split(';').map((part) => part.trim()).includes(`admin=${ADMIN_COOKIE}`);
}

function isBlockedAdminPath(req) {
  const visiblePath = visibleRoutePath(req.url);
  return visiblePath === '/admin' || visiblePath.startsWith('/admin/');
}

function cacheKey(req) {
  return `${req.method}:${canonicalCachePath(req.url)}`;
}

function shouldReadCache(req) {
  if (req.method !== 'GET') return false;
  const keyPath = canonicalCachePath(req.url);
  return keyPath === '/api/report' || keyPath.startsWith('/assets/');
}

function shouldStore(headers) {
  const cacheControl = String(headers['cache-control'] || '');
  return /\bpublic\b/i.test(cacheControl) && /\bmax-age=(\d+)\b/i.test(cacheControl);
}

function maxAgeMs(headers) {
  const cacheControl = String(headers['cache-control'] || '');
  const match = cacheControl.match(/\bmax-age=(\d+)\b/i);
  return match ? Number(match[1]) * 1000 : 0;
}

function stripHopByHop(headers) {
  const output = {};
  const blocked = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'x-edge-checked',
    'x-edge-persona',
    'x-edge-seal',
    'x-admin',
    'x-internal'
  ]);

  for (const [name, value] of Object.entries(headers)) {
    if (blocked.has(name)) continue;
    output[name] = value;
  }

  return output;
}

function sendJson(res, statusCode, body, extraHeaders = {}) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    ...extraHeaders
  });
  res.end(payload);
}

function sendCached(req, res, entry) {
  const headers = {
    ...entry.headers,
    age: String(Math.max(0, Math.floor((Date.now() - entry.storedAt) / 1000))),
    'x-cache': 'HIT',
    'x-cache-key': entry.key
  };

  if (entry.reportId) {
    headers['x-edge-seal'] = hmac(`${entry.key}:${entry.reportId}:${entry.bodyHash}`);
  }

  delete headers['set-cookie'];
  delete headers['connection'];
  delete headers['transfer-encoding'];
  delete headers['content-length'];

  res.writeHead(entry.statusCode, headers);
  res.end(entry.body);
}

function cacheEntryFromResponse(key, statusCode, headers, body) {
  let reportId = null;
  const contentType = String(headers['content-type'] || '');

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(body.toString('utf8'));
      if (parsed && typeof parsed.report_id === 'string') reportId = parsed.report_id;
    } catch {
      reportId = null;
    }
  }

  return {
    key,
    statusCode,
    headers,
    body,
    bodyHash: sha256(body),
    reportId,
    storedAt: Date.now(),
    expiresAt: Date.now() + maxAgeMs(headers)
  };
}

function proxyToOrigin(req, res, body) {
  const headers = stripHopByHop(req.headers);
  headers.host = `${ORIGIN_HOST}:${ORIGIN_PORT}`;
  headers['x-edge-checked'] = '1';
  headers['x-edge-persona'] = hasAdminCookie(req) ? 'admin' : 'guest';
  headers['x-forwarded-host'] = req.headers.host || `127.0.0.1:${EDGE_PORT}`;
  headers['x-forwarded-proto'] = 'http';

  const options = {
    host: ORIGIN_HOST,
    port: ORIGIN_PORT,
    method: req.method,
    path: req.url,
    headers
  };

  const upstream = http.request(options, (originRes) => {
    const chunks = [];
    let total = 0;

    originRes.on('data', (chunk) => {
      total += chunk.length;
      if (total <= MAX_BODY) chunks.push(chunk);
    });

    originRes.on('end', () => {
      const responseBody = Buffer.concat(chunks);
      const responseHeaders = { ...originRes.headers };
      const key = cacheKey(req);

      responseHeaders['x-cache'] = 'MISS';
      responseHeaders['x-cache-key'] = key;

      delete responseHeaders['connection'];
      delete responseHeaders['transfer-encoding'];
      delete responseHeaders['content-length'];

      if (shouldReadCache(req) && total <= MAX_BODY && shouldStore(originRes.headers)) {
        cache.set(key, cacheEntryFromResponse(key, originRes.statusCode, { ...originRes.headers }, responseBody));
      }

      res.writeHead(originRes.statusCode, responseHeaders);
      res.end(responseBody);
    });
  });

  upstream.on('error', (error) => {
    sendJson(res, 502, {
      error: 'bad_gateway',
      detail: error.message
    });
  });

  if (body.length) upstream.write(body);
  upstream.end();
}

const server = http.createServer((req, res) => {
  if (isBlockedAdminPath(req) && !hasAdminCookie(req)) {
    return sendJson(res, 403, {
      error: 'edge_forbidden',
      detail: 'admin routes are only reachable from the private control plane'
    }, {
      'cache-control': 'no-store',
      'x-cache': 'BYPASS'
    });
  }

  if (shouldReadCache(req)) {
    const key = cacheKey(req);
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return sendCached(req, res, entry);
    }
    if (entry) cache.delete(key);
  }

  const chunks = [];
  let total = 0;

  req.on('data', (chunk) => {
    total += chunk.length;
    if (total <= MAX_BODY) chunks.push(chunk);
    else req.destroy();
  });

  req.on('end', () => {
    proxyToOrigin(req, res, Buffer.concat(chunks));
  });
});

server.listen(EDGE_PORT, EDGE_HOST, () => {
  console.log(`edge listening on http://${EDGE_HOST}:${EDGE_PORT}, forwarding to ${ORIGIN_HOST}:${ORIGIN_PORT}`);
});
