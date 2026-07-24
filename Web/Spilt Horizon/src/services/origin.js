'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ORIGIN_BIND = process.env.ORIGIN_BIND || process.env.HOST || '127.0.0.1';
const ORIGIN_PORT = Number(process.env.ORIGIN_PORT || 4001);
const TEAM_SECRET = process.env.TEAM_SECRET || 'dev-team-secret';
const EDGE_SEAL_SECRET = process.env.EDGE_SEAL_SECRET || 'dev-edge-seal-secret';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FLAG_FILE = path.join(__dirname, '..', 'flag.txt');

function loadFlag() {
  if (process.env.FLAG) return process.env.FLAG;

  try {
    return fs.readFileSync(FLAG_FILE, 'utf8').trim();
  } catch {
    return 'TriHack26{spl1t_h0r1z0n_c4ch3_pr00f_r3qu1r3d}';
  }
}

const FLAG = loadFlag();

function hmac(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function safeDecode(value) {
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

function normalizePath(pathname) {
  return removeDotSegments(collapseSlashes(pathname));
}

function forwardedPrefix(req) {
  const raw = req.headers['x-forwarded-prefix'];
  if (!raw || Array.isArray(raw)) return '';

  const prefix = String(raw).split(',').pop().trim();
  if (!prefix.startsWith('/')) return '';
  if (prefix.length > 48) return '';
  if (prefix.includes('\u0000')) return '';

  return normalizePath(prefix);
}

function effectivePath(req) {
  const url = new URL(req.url, 'http://origin.local');
  let pathname = safeDecode(url.pathname);

  const nextData = pathname.match(/^\/_next\/data\/[^/]+(\/.*)\.json$/);
  if (nextData) pathname = nextData[1];

  pathname = normalizePath(pathname);

  const prefix = forwardedPrefix(req);
  if (prefix) {
    pathname = normalizePath(`${prefix}/${pathname}`);
  }

  return pathname;
}

function requestUrl(req) {
  return new URL(req.url, 'http://origin.local');
}

function send(res, statusCode, body, headers = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(statusCode, {
    'content-length': payload.length,
    ...headers
  });
  res.end(payload);
}

function sendJson(res, statusCode, body, headers = {}) {
  const payload = JSON.stringify(body, null, 2);
  send(res, statusCode, payload, {
    'content-type': 'application/json; charset=utf-8',
    ...headers
  });
}

function noStoreJson(res, statusCode, body) {
  sendJson(res, statusCode, body, {
    'cache-control': 'no-store'
  });
}

function requireEdge(req, res) {
  if (req.headers['x-edge-checked'] !== '1') {
    noStoreJson(res, 421, {
      error: 'misdirected_request',
      detail: 'origin only accepts traffic that has passed through the edge'
    });
    return false;
  }
  return true;
}

function currentSlot() {
  return Math.floor(Date.now() / 30000);
}

function reportId() {
  return hmac(TEAM_SECRET, `report:${currentSlot()}`).slice(0, 16);
}

function vaultTicket(id) {
  return hmac(TEAM_SECRET, `vault:${id}:${currentSlot()}`).slice(0, 32);
}

function validTicket(id, ticket) {
  for (const delta of [-1, 0, 1]) {
    const slot = currentSlot() + delta;
    const expected = hmac(TEAM_SECRET, `vault:${id}:${slot}`).slice(0, 32);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(ticket || '').padEnd(expected.length, '0').slice(0, expected.length)))) {
      return true;
    }
  }
  return false;
}

function validEdgeSeal(key, id, bodyHash, seal) {
  if (!seal || !bodyHash) return false;
  const expected = hmac(EDGE_SEAL_SECRET, `${key}:${id}:${bodyHash}`);
  const got = String(seal);
  if (got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

function indexHtml() {
  return fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'));
}

function stylesheet() {
  return fs.readFileSync(path.join(PUBLIC_DIR, 'style.css'));
}

function publicReport(req, res) {
  sendJson(res, 200, {
    service: 'northwind-insights',
    report: 'public-summary',
    window: 'rolling-30m',
    generated_at: new Date().toISOString(),
    note: 'Public reports are distributed from the edge cache.',
    routes: [
      '/api/report',
      '/_next/data/2026.05.10/api/report.json'
    ]
  }, {
    'cache-control': 'public, max-age=20',
    'x-origin-route': effectivePath(req)
  });
}

function adminReport(req, res) {
  const id = reportId();
  const ticket = vaultTicket(id);

  sendJson(res, 200, {
    service: 'northwind-insights',
    report: 'admin-risk-export',
    report_id: id,
    generated_at: new Date().toISOString(),
    previous_stage: 'TriHack26{fake_flag_keep_going_this_is_not_final}',
    classification: 'restricted',
    vault_path: `/admin/api/vault?id=${id}&ticket=${ticket}`,
    cache_note: 'Vault export requires an edge seal from the cached report object.',
    operator_hint: 'A stale public object should never carry this report_id.'
  }, {
    'cache-control': 'public, max-age=20',
    'x-origin-route': effectivePath(req)
  });
}

function adminVault(req, res) {
  const url = requestUrl(req);
  const id = url.searchParams.get('id') || '';
  const ticket = url.searchParams.get('ticket') || '';
  const seal = url.searchParams.get('seal') || req.headers['x-edge-seal'] || '';
  const bodyHash = url.searchParams.get('body_hash') || '';
  const key = 'GET:/api/report';

  if (!validTicket(id, ticket)) {
    return noStoreJson(res, 403, {
      error: 'bad_ticket',
      detail: 'vault tickets are short lived and bound to a report id'
    });
  }

  if (!validEdgeSeal(key, id, bodyHash, seal)) {
    return noStoreJson(res, 403, {
      error: 'missing_edge_proof',
      detail: 'the vault only opens for a report that was served back from the edge cache'
    });
  }

  sendJson(res, 200, {
    flag: FLAG,
    report_id: id,
    proof: 'cache-hit-seal-accepted'
  }, {
    'cache-control': 'no-store'
  });
}

function notFound(req, res) {
  noStoreJson(res, 404, {
    error: 'not_found',
    route: effectivePath(req)
  });
}

const server = http.createServer((req, res) => {
  if (!requireEdge(req, res)) return;

  const route = effectivePath(req);

  if (req.method === 'GET' && route === '/') {
    return send(res, 200, indexHtml(), {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    });
  }

  if (req.method === 'GET' && route === '/assets/style.css') {
    return send(res, 200, stylesheet(), {
      'content-type': 'text/css; charset=utf-8',
      'cache-control': 'public, max-age=300'
    });
  }

  if (req.method === 'GET' && route === '/api/report') {
    return publicReport(req, res);
  }

  if (req.method === 'GET' && route === '/admin/api/report') {
    return adminReport(req, res);
  }

  if (req.method === 'GET' && route === '/admin/api/vault') {
    return adminVault(req, res);
  }

  return notFound(req, res);
});

server.listen(ORIGIN_PORT, ORIGIN_BIND, () => {
  console.log(`origin listening on http://${ORIGIN_BIND}:${ORIGIN_PORT}`);
});
