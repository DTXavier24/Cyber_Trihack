const express = require('express');


function accountRoutes(store) {
  const router = express.Router();

  router.put('/api/v2/:username/email', (req, res) => {
    const user = req.session.userId && store.users.get(req.session.userId);
    if (!user) return res.status(401).json({ error: 'auth.no_session' });
    if (req.params.username !== user.username)
      return res.status(403).json({ error: 'forbidden' }); 
    if (req.header('X-CSRF-Token') !== req.session.csrf)
      return res.status(403).json({ error: 'csrf' });
    const email = (req.query && req.query.email) || (req.body && req.body.email);
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'missing_email' });
    user.email = email;     return res.json({ ok: true, email });
  });

  return router;
}

module.exports = { accountRoutes };
