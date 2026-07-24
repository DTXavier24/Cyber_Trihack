const path = require('path');
const { randomBytes } = require('crypto');
const express = require('express');
const { sessionMiddleware } = require('./lib/session');
const { webRoutes } = require('./lib/web');
const { edgeAcl } = require('./lib/edgeAcl');
const { normalizer } = require('./lib/normalizer');
const { authRoutes } = require('./lib/routes/auth');
const { accountRoutes } = require('./lib/routes/account');
const { mailRoutes } = require('./lib/routes/mail');
const { reportRoutes } = require('./lib/routes/report');
const { adminRoutes } = require('./lib/routes/admin');

function createApp({ store } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.locals.store = store;
  app.use(express.json());
  app.get('/app.js', (req, res) =>
    res.type('application/javascript').sendFile(path.join(__dirname, 'public', 'app.js')));
  app.get('/ui.js', (req, res) =>
    res.type('application/javascript').sendFile(path.join(__dirname, 'public', 'ui.js')));
  app.get('/styles.css', (req, res) =>
    res.type('text/css').sendFile(path.join(__dirname, 'public', 'styles.css')));
  if (store) {
    app.use(sessionMiddleware(store));
    app.use(edgeAcl);
    app.use(normalizer);
    app.use((req, res, next) => {
      const nonce = randomBytes(16).toString('base64');
      req.cspNonce = nonce;
      res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        `script-src 'self' 'nonce-${nonce}'; ` +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; connect-src 'self'; " +
        "object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
      next();
    });
    app.use(authRoutes(store));
    app.use(accountRoutes(store));
    app.use(mailRoutes(store));
    app.use(webRoutes(store));
    app.use(reportRoutes(store));
    app.use(adminRoutes(store));
  }
  app.get('/healthz', (req, res) => res.json({ ok: true }));
  return app;
}

module.exports = { createApp };
