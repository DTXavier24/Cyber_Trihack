'use strict';

const { spawn } = require('child_process');

const env = {
  ...process.env,
  EDGE_HOST: process.env.EDGE_HOST || process.env.HOST || '127.0.0.1',
  ORIGIN_BIND: process.env.ORIGIN_BIND || '127.0.0.1',
  ORIGIN_HOST: process.env.ORIGIN_HOST || '127.0.0.1',
  ORIGIN_PORT: process.env.ORIGIN_PORT || '4001',
  EDGE_PORT: process.env.EDGE_PORT || '3000',
  TEAM_SECRET: process.env.TEAM_SECRET || 'local-team-secret',
  EDGE_SEAL_SECRET: process.env.EDGE_SEAL_SECRET || 'local-edge-seal-secret',
  ADMIN_COOKIE: process.env.ADMIN_COOKIE || 'local-admin-cookie-not-for-players'
};

const children = [
  spawn(process.execPath, ['--preserve-symlinks-main', 'services/origin.js'], { stdio: 'inherit', env }),
  spawn(process.execPath, ['--preserve-symlinks-main', 'services/edge.js'], { stdio: 'inherit', env })
];

function stop() {
  for (const child of children) child.kill('SIGTERM');
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 143) process.exit(code);
  });
}
