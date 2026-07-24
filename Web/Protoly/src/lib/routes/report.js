const express = require('express');
const { page } = require('../web');

function reportPage() {
  return `<div class="card card-narrow">
    <h1>Share a link for review</h1>
    <p class="muted">Found a prototype link on Protoly that needs a second look? Submit it and a reviewer will open it.</p>
    <form id="report-form" novalidate>
      <div class="field"><label for="report-url">Link (same-site path)</label><input id="report-url" name="url" placeholder="/dashboard?ref=..." required><div class="hint">Must be a path on this site, starting with <code>/</code>.</div></div>
      <button class="btn block" type="submit">Submit for review</button>
      <div id="report-msg" class="form-msg"></div>
    </form>
  </div>`;
}

function reportRoutes(store) {
  const router = express.Router();
  router.get('/report', (req, res) => {
    if (!(req.session.userId && store.users.get(req.session.userId)))
      return res.redirect('/login');
    res.type('html').send(page(req, store, reportPage()));
  });
  router.post('/report', (req, res) => {
    if (!(req.session.userId && store.users.get(req.session.userId)))
      return res.status(401).json({ error: 'auth.no_session' });
    const { url } = req.body || {};
    if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//'))
      return res.status(400).json({ error: 'path_must_be_same_site' });
    let probe = url;
    try { probe = decodeURIComponent(url); } catch { }
    if (/\.\.[/\\]/.test(probe))
      return res.status(500).json({ error: '' });
    store.reportQueue.push(url);
    res.json({ ok: true });
  });
  return router;
}

module.exports = { reportRoutes };
