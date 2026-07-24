const express = require('express');
const { randomBytes } = require('crypto');

function mailRoutes(store) {
  const router = express.Router();

  router.post('/forgot-password', (req, res) => {
    const { username } = req.body || {};
    const user = store.findByUsername(username);
    if (user) {
      const token = randomBytes(16).toString('hex');
      store.resetTokens.set(token, user.id);
      store.sendMail(user.email, {
        subject: 'Reset your Protoly password',
        body: 'Click the link to reset your password.',
        link: `/reset?token=${token}`,
      });
    }
    res.json({ ok: true }); 
});

  router.post('/reset-password', (req, res) => {
    const { token, password } = req.body || {};
    const userId = token && store.resetTokens.get(token);
    if (!userId || !password) return res.status(400).json({ error: 'invalid_token' });
    store.users.get(userId).passwordHash = store.hashPassword(password);
    store.resetTokens.delete(token);
    res.json({ ok: true });
  });

  router.get('/outbox', (req, res) => {
    const user = req.session.userId && store.users.get(req.session.userId);
    if (!user) return res.status(401).json({ error: 'auth.no_session' });
    res.json(store.mailboxes.get(user.email) || []);
  });

  return router;
}

module.exports = { mailRoutes };
