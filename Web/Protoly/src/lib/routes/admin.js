const express = require('express');
const { page } = require('../web');

function adminRoutes(store) {
  const router = express.Router();

  router.all('/api/v2/teams/:teamId/invites/:inviteId', (req, res) => {
    if (!(req.session.userId && store.users.get(req.session.userId)))
      return res.status(401).json({ error: 'auth.no_session' });
    res.json({ team: req.params.teamId, invite: req.params.inviteId, ok: true });
  });


  router.get('/admin', (req, res) => {
    const user = req.session.userId && store.users.get(req.session.userId);
    if (!user || !user.isAdmin || !req.session.mfaPassed)
      return res.status(403).send('forbidden');
    res.type('html').send(page(req, store, `<div class="card card-narrow-flag">
      <span class="pill ok"><span class="dot"></span>Administrator</span>
      <h1 style="margin-top:.6rem">Admin dashboard</h1>
      <p>Flag: <inline class="flag">${store.flag}</inline></p>
    </div>`));
  });

  return router;
}

module.exports = { adminRoutes };
