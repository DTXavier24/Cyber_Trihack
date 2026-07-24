const express = require('express');

function authRoutes(store) {
  const router = express.Router();

  router.post('/register', (req, res) => {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'missing_fields' });
    if (store.findByUsername(username)) return res.status(409).json({ error: 'user_exists' });
    if ([...store.users.values()].some((u) => u.email === email))
      return res.status(409).json({ error: 'email_exists' });
    const user = store.createUser({ username, email, password });
    req.session.userId = user.id;
    req.session.mfaPassed = true; 
    return res.status(201).json({ ok: true });
  });

  router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = store.findByUsername(username);
    if (!user || !store.verifyPassword(password, user.passwordHash))
      return res.status(401).json({ error: 'auth.invalid' });
    if (user.isAdmin) {
      req.session.userId = null;
      req.session.pending2fa = user.id;
      req.session.mfaPassed = false;
      return res.status(200).json({ mfa_required: true });
    }
    req.session.userId = user.id;
    req.session.pending2fa = null;
    req.session.mfaPassed = true;
    return res.status(200).json({ mfa_required: false });
  });

  router.post('/logout', (req, res) => {
    if (req.session) { req.session.userId = null; req.session.pending2fa = null; req.session.mfaPassed = false; }
    res.redirect('/');
  });

  router.post('/api/v2/auth/2fa', (req, res) => {
    const pending = req.session.pending2fa;
    if (!pending) return res.status(401).json({ error: 'auth.no_session' });
    const code = req.header('X-2FA-Code');
    if (store.pendingCodes[code]) {
      req.session.userId = pending;
      req.session.mfaPassed = true;
      req.session.pending2fa = null;
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: 'auth.code_invalid' });
  });

  return router;
}

module.exports = { authRoutes };
