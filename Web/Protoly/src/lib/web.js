const express = require('express');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const LOGO = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
  `<path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5z" fill="url(#lg)" fill-opacity="0.18" stroke="url(#lg)" stroke-width="1.5" stroke-linejoin="round"/>` +
  `<path d="M4 7l8 4.5L20 7M12 11.5V21.5" stroke="url(#lg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<defs><linearGradient id="lg" x1="4" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">` +
  `<stop stop-color="#22d3ee"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs></svg>`;

function currentUser(req, store) {
  return (req.session && req.session.userId && store.users.get(req.session.userId)) || null;
}

function nav(user) {
  var links = user
    ? `<a class="hide-sm" href="/dashboard">Dashboard</a>` +
      `<a href="/teams">Teams</a>` +
      `<a href="/mail">Outbox</a>` +
      `<a href="/account">Account</a>` +
      `<a class="hide-sm" href="/report">Report</a>` +
      `<span class="nav-user">${esc(user.username)}</span>` +
      `<form class="nav-logout" method="POST" action="/logout"><button class="btn ghost sm" type="submit">Log out</button></form>`
    : `<a href="/login">Log in</a>` +
      `<a class="btn sm" href="/register">Sign up</a>`;
    if (user && (user.username == 'admin'))
        links = `<a href="/admin">Admin</a>` + links;
  return `<nav class="nav"><a class="brand" href="/">${LOGO}<span>Protoly</span></a><div class="nav-links">${links}</div></nav>`;
}

function page(req, store, bodyHtml) {
  const csrf = (req.session && req.session.csrf) || '';
  const nonce = (req && req.cspNonce) || '';
  const user = currentUser(req, store);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Protoly</title>
<link rel="stylesheet" href="/styles.css">
<script nonce="${nonce}">window.__csrf=${JSON.stringify(csrf)};window.__me=${JSON.stringify(user ? user.username : null)};</script>
</head><body>
${nav(user)}
<main class="wrap">
${bodyHtml}
</main>
<footer class="foot">© Protoly — prototypes, shipped faster. <span class="muted">Demo environment.</span></footer>
<div id="toast" class="toast"></div>
<script src="/app.js"></script>
<script src="/ui.js"></script>
</body></html>`;
}

function landing(user) {
  const cta = user
    ? `<a class="btn" href="/dashboard">Go to dashboard</a><a class="btn ghost" href="/teams">Manage teams</a>`
    : `<a class="btn" href="/register">Start free</a><a class="btn ghost" href="/login">Log in</a>`;
  const feature = (t, d) => `<div class="card"><div class="eyebrow">${esc(t)}</div><p style="margin:.5rem 0 0" class="muted">${esc(d)}</p></div>`;
  return `<section class="hero">
    <div class="eyebrow">Prototyping, on autopilot</div>
    <h1>Ship fast. <span class="grad">Prototype faster.</span></h1>
    <p class="lede">Protoly turns your team's ideas into working prototypes — version every build, share live preview links, and gather feedback the moment something changes.</p>
    <div class="row" style="margin-top:1.4rem">${cta}</div>
    <div class="stats">
      <div class="stat"><b>12.4k</b><span>prototypes shipped / mo</span></div>
      <div class="stat"><b>320ms</b><span>median preview build</span></div>
      <div class="stat"><b>99.98%</b><span>uptime</span></div>
    </div>
    <div class="logos">
      <span class="pill">acme</span><span class="pill">northwind</span><span class="pill">globex</span><span class="pill">initech</span><span class="pill">umbrella</span>
    </div>
  </section>
  <section class="grid" style="margin-top:1.6rem">
    ${feature('Instant previews', 'Every commit renders a shareable prototype before it reaches your team.')}
    ${feature('Version history', 'Every revision is captured, diffed, and one click away from rollback.')}
    ${feature('Team access', 'Invite teammates, scope access per project, and keep an auditable trail.')}
    ${feature('Live feedback', 'Route comments to the people who can act on them — no dashboards to babysit.')}
  </section>`;
}

function registerPage() {
  return `<div class="card card-narrow">
    <h1>Create your account</h1>
    <p class="muted">Start building prototypes with your team in minutes.</p>
    <form id="register-form" novalidate>
      <div class="field"><label for="reg-username">Username</label><input id="reg-username" name="username" autocomplete="username" placeholder="jdoe" required></div>
      <div class="field"><label for="reg-email">Work email</label><input id="reg-email" name="email" type="email" autocomplete="email" placeholder="jdoe@acme.com" required></div>
      <div class="field"><label for="reg-password">Password</label><input id="reg-password" name="password" type="password" autocomplete="new-password" placeholder="••••••••" required></div>
      <button class="btn block" type="submit">Create account</button>
      <div id="register-msg" class="form-msg"></div>
    </form>
    <p class="hint">Already have an account? <a href="/login">Log in</a></p>
  </div>`;
}

function loginPage() {
  return `<div class="card card-narrow">
    <div id="login-step">
      <h1>Welcome back</h1>
      <p class="muted">Log in to your Protoly workspace.</p>
      <form id="login-form" novalidate>
        <div class="field"><label for="login-username">Username</label><input id="login-username" name="username" autocomplete="username" placeholder="jdoe" required></div>
        <div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
        <button class="btn block" type="submit">Continue</button>
        <div id="login-msg" class="form-msg"></div>
      </form>
      <p class="hint"><a href="/forgot-password">Forgot password?</a> · <a href="/register">Create an account</a></p>
    </div>
    <div id="twofa-step" class="hidden">
      <!-- TODO(auth): migrate 2FA from object to map -->
      <h1>Two-factor</h1>
      <p class="muted">Enter the 6-digit code we texted to your phone.</p>
      <form id="twofa-form" novalidate>
        <div class="field"><label for="twofa-code">Verification code</label><input id="twofa-code" name="code" inputmode="numeric" placeholder="123456" autocomplete="one-time-code"></div>
        <button class="btn block" type="submit">Verify &amp; sign in</button>
        <div id="twofa-msg" class="form-msg"></div>
      </form>
    </div>
  </div>`;
}

function forgotPage() {
  return `<div class="card card-narrow">
    <h1>Reset your password</h1>
    <p class="muted">Tell us your username and we'll email a reset link to the address on file.</p>
    <form id="forgot-form" novalidate>
      <div class="field"><label for="forgot-username">Username</label><input id="forgot-username" name="username" autocomplete="username" placeholder="jdoe" required></div>
      <button class="btn block" type="submit">Send reset link</button>
      <div id="forgot-msg" class="form-msg"></div>
    </form>
    <p class="hint"><a href="/login">Back to sign in</a></p>
  </div>`;
}

function resetPage(token) {
  return `<div class="card card-narrow">
    <h1>Choose a new password</h1>
    <p class="muted">${token ? 'Enter a new password for your account.' : 'This page expects a reset token from your email link.'}</p>
    <form id="reset-form" novalidate>
      <input id="reset-token" name="token" type="hidden" value="${esc(token)}">
      <div class="field"><label for="reset-password-input">New password</label><input id="reset-password-input" name="password" type="password" autocomplete="new-password" placeholder="••••••••" required></div>
      <button class="btn block" type="submit">Reset password</button>
      <div id="reset-msg" class="form-msg${token ? '' : ' err'}">${token ? '' : 'Missing or invalid reset token.'}</div>
    </form>
  </div>`;
}

function dashboardPage(user) {
  return `<div class="row" style="justify-content:space-between;align-items:flex-end">
    <div><div class="eyebrow">Workspace</div><h1>Welcome, ${esc(user.username)}</h1></div>
    <span class="pill ok"><span class="dot"></span>All builds green</span>
  </div>
  <section class="grid" style="margin-top:1.2rem">
    <div class="card">
      <h3>Prototype health</h3>
      <div class="gauge">86<span class="s"> / 100</span></div>
      <div class="bar" style="margin-top:.6rem"><i style="width:86%"></i></div>
      <p class="hint">Up 4 points this week.</p>
    </div>
    <div class="card">
      <h3>Open issues</h3>
      <ul class="list" style="margin-top:.6rem">
        <li><span class="subj">Tolerance drift</span><div class="meta">enclosure-v3 · <span class="pill warn"><span class="dot"></span>medium</span></div></li>
        <li><span class="subj">Missing datasheet</span><div class="meta">sensor-board · <span class="pill warn"><span class="dot"></span>medium</span></div></li>
      </ul>
    </div>
    <div class="card">
      <h3>Team invites</h3>
      <p class="muted" style="margin-bottom:.8rem">Add teammates and scope their access per project.</p>
      <a class="btn sm" href="/teams">Invite a teammate</a>
    </div>
  </section>`;
}

function teamsPage() {
  const team = (name, members, tag) =>
    `<div class="card tight"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(name)}</h3><span class="pill">${esc(tag)}</span></div><p class="hint" style="margin:.5rem 0 0">${members} members</p></div>`;
  return `<h1>Teams</h1>
  <p class="muted">Organize members into teams and invite collaborators.</p>
  <section class="grid" style="margin:1rem 0 1.8rem">
    ${team('Engineering', 14, 't-eng-42')}
    ${team('Design', 6, 't-dsn-07')}
    ${team('Platform', 9, 't-plat-11')}
  </section>
  <div class="card" style="max-width:560px">
    <h2>Invite to a team</h2>
    <p class="muted">We'll send an invitation and add them as soon as they accept.</p>
    <form id="invite-form" novalidate>
      <div class="field"><label for="inv-team">Team ID</label><input id="inv-team" name="teamId" value="t-eng-42" required><div class="hint">The team's short identifier.</div></div>
      <div class="field"><label for="inv-invitee">Invitee email</label><input id="inv-invitee" name="invitee" type="email" placeholder="teammate@acme.com"></div>
      <button class="btn" type="submit">Send invite</button>
      <div id="invite-msg" class="form-msg"></div>
    </form>
    <h3 style="margin-top:1.4rem">Pending invites</h3>
    <ul id="invite-list" class="list"></ul>
    <div id="invite-empty" class="empty">No pending invites yet.</div>
  </div>`;
}

function mailPage() {
  return `<h1>Outbox</h1>
  <p class="muted">Messages Protoly has sent to your account's email address.</p>
  <div id="mailbox"><div class="empty">Loading…</div></div>`;
}

function accountPage(user) {
  return `<h1>Account settings</h1>
  <p class="muted">Manage the details of your Protoly account.</p>
  <div class="card card-narrow" style="margin-left:0">
    <h2>Change email</h2>
    <p class="muted">This is where reset links and important notices are delivered.</p>
    <form id="email-form" novalidate>
      <div class="field"><label>Current email</label><input value="${esc(user.email)}" disabled></div>
      <div class="field"><label for="acct-email">New email</label><input id="acct-email" name="email" type="email" placeholder="you@example.com" required></div>
      <button class="btn" type="submit">Update email</button>
      <div id="email-msg" class="form-msg"></div>
    </form>
  </div>`;
}

function webRoutes(store) {
  const router = express.Router();

  router.get('/', (req, res) =>
    res.type('html').send(page(req, store, landing(currentUser(req, store)))));

  router.get('/register', (req, res) => {
    if (currentUser(req, store)) return res.redirect('/dashboard');
    res.type('html').send(page(req, store, registerPage()));
  });

  router.get('/login', (req, res) => {
    if (currentUser(req, store)) return res.redirect('/dashboard');
    res.type('html').send(page(req, store, loginPage()));
  });

  router.get('/forgot-password', (req, res) =>
    res.type('html').send(page(req, store, forgotPage())));

  router.get('/reset', (req, res) =>
    res.type('html').send(page(req, store, resetPage(typeof req.query.token === 'string' ? req.query.token : ''))));

  router.get('/dashboard', (req, res) => {
    const user = currentUser(req, store);
    if (!user) return res.redirect('/login');
    res.type('html').send(page(req, store, dashboardPage(user)));
  });

  router.get('/teams', (req, res) => {
    if (!currentUser(req, store)) return res.redirect('/login');
    res.type('html').send(page(req, store, teamsPage()));
  });

  router.get('/mail', (req, res) => {
    if (!currentUser(req, store)) return res.redirect('/login');
    res.type('html').send(page(req, store, mailPage()));
  });

  router.get('/account', (req, res) => {
    const user = currentUser(req, store);
    if (!user) return res.redirect('/login');
    res.type('html').send(page(req, store, accountPage(user)));
  });

  return router;
}

module.exports = { webRoutes, page, esc };
