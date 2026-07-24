(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var toastEl = null, toastTimer = null;

  function toast(msg, kind) {
    toastEl = toastEl || $('#toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = 'toast'; }, 3200);
  }

  function setMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'form-msg' + (kind ? ' ' + kind : '');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function postJson(url, body, headers) {
    var res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: Object.assign({ 'content-type': 'application/json' }, headers || {}),
      body: JSON.stringify(body || {}),
    });
    var data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON */ }
    return { status: res.status, data: data };
  }

  var reg = $('#register-form');
  if (reg) {
    reg.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('#register-msg');
      setMsg(msg, 'Creating account…');
      var r = await postJson('/register', {
        username: $('#reg-username').value.trim(),
        email: $('#reg-email').value.trim(),
        password: $('#reg-password').value,
      });
      if (r.status === 201) { location.href = '/dashboard'; return; }
      var m = { user_exists: 'That username is taken.', email_exists: 'That email is already registered.', missing_fields: 'Please fill in every field.' };
      setMsg(msg, (r.data && m[r.data.error]) || 'Could not create account.', 'err');
    });
  }

  var login = $('#login-form');
  if (login) {
    login.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('#login-msg');
      setMsg(msg, 'Signing in…');
      var r = await postJson('/login', {
        username: $('#login-username').value.trim(),
        password: $('#login-password').value,
      });
      if (r.status === 200 && r.data) {
        if (r.data.mfa_required) {
          $('#login-step').classList.add('hidden');
          $('#twofa-step').classList.remove('hidden');
          setMsg(msg, '');
          var code = $('#twofa-code'); if (code) code.focus();
        } else {
          location.href = '/dashboard';
        }
        return;
      }
      setMsg(msg, 'Invalid username or password.', 'err');
    });
  }
  var twofa = $('#twofa-form');
  if (twofa) {
    twofa.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('#twofa-msg');
      setMsg(msg, 'Verifying…');
      var r = await postJson('/api/v2/auth/2fa', {}, { 'X-2FA-Code': $('#twofa-code').value.trim() });
      if (r.status === 200) { location.href = '/dashboard'; return; }
      setMsg(msg, 'That code was not accepted.', 'err');
    });
  }

  var forgot = $('#forgot-form');
  if (forgot) {
    forgot.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('#forgot-msg');
      setMsg(msg, 'Sending…');
      await postJson('/forgot-password', { username: $('#forgot-username').value.trim() });
      setMsg(msg, 'If that account exists, a reset link is on its way to the registered email.', 'ok');
      forgot.reset();
    });
  }

  var reset = $('#reset-form');
  if (reset) {
    reset.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('#reset-msg');
      setMsg(msg, 'Updating password…');
      var r = await postJson('/reset-password', {
        token: $('#reset-token').value,
        password: $('#reset-password-input').value,
      });
      if (r.status === 200) {
        setMsg(msg, 'Password updated. Redirecting to sign in…', 'ok');
        setTimeout(function () { location.href = '/login'; }, 1200);
        return;
      }
      setMsg(msg, 'This reset link is invalid or has expired.', 'err');
    });
  }

  var invite = $('#invite-form');
  if (invite) {
    invite.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('#invite-msg');
      var teamId = $('#inv-team').value.trim();
      var invitee = $('#inv-invitee').value.trim();
      if (!teamId) { setMsg(msg, 'Enter a team ID.', 'err'); return; }
      var inviteId = 'inv-' + Math.random().toString(36).slice(2, 10);
      history.replaceState({}, '', '/teams?action=team-invite&teamId=' + encodeURIComponent(teamId) +
        '&inviteId=' + encodeURIComponent(inviteId) + '&method=1');
      if (typeof window.handleTeamInvite === 'function') window.handleTeamInvite();
      setMsg(msg, 'Invite sent' + (invitee ? ' to ' + invitee : '') + '.', 'ok');
      var list = $('#invite-list');
      if (list) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="subj">' + esc(invitee || inviteId) + '</span>' +
          '<span class="meta"> · team ' + esc(teamId) + ' · <span class="pill warn"><span class="dot"></span>pending</span></span>';
        list.insertBefore(li, list.firstChild);
        var empty = $('#invite-empty'); if (empty) empty.classList.add('hidden');
      }
    });
  }

  var report = $('#report-form');
  if (report) {
    report.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('#report-msg');
      setMsg(msg, 'Submitting…');
      var r = await postJson('/report', { url: $('#report-url').value.trim() });
      if (r.status === 200) {
        setMsg(msg, 'Thanks — a reviewer will open this link shortly.', 'ok');
        report.reset();
        return;
      }
      var m = { path_must_be_same_site: 'Only same-site paths (starting with /) can be reviewed.' };
      setMsg(msg, (r.data && m[r.data.error]) || 'Could not submit that link.', 'err');
    });
  }

  var emailForm = $('#email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('#email-msg');
      var email = $('#acct-email').value.trim();
      setMsg(msg, 'Saving…');
      var res = await fetch('/api/v2/' + encodeURIComponent(window.__me) + '/email', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json', 'X-CSRF-Token': window.__csrf },
        body: JSON.stringify({ email: email }),
      });
      if (res.status === 200) { setMsg(msg, 'Email updated to ' + email + '.', 'ok'); return; }
      var m = { csrf: 'Session token missing or invalid.', missing_email: 'Enter a valid email address.', 'auth.no_session': 'Please sign in again.' };
      var data = null; try { data = await res.json(); } catch (e2) { /* non-JSON */ }
      setMsg(msg, (data && m[data.error]) || 'Could not update email.', 'err');
    });
  }

  var mailbox = $('#mailbox');
  if (mailbox) {
    fetch('/outbox', { credentials: 'include' }).then(function (res) {
      if (res.status === 401) { mailbox.innerHTML = '<div class="empty">Sign in to view your outbox.</div>'; return null; }
      return res.json();
    }).then(function (items) {
      if (!items) return;
      if (!items.length) { mailbox.innerHTML = '<div class="empty">Your outbox is empty.</div>'; return; }
      var html = '<ul class="list">';
      items.forEach(function (m) {
        html += '<li><div class="subj">' + esc(m.subject) + '</div>' +
          '<div class="meta">' + esc(m.body) + '</div>' +
          (m.link ? '<div style="margin-top:.5rem"><a href="' + esc(m.link) + '">' + esc(m.link) + '</a></div>' : '') +
          '</li>';
      });
      html += '</ul>';
      mailbox.innerHTML = html;
    }).catch(function () {
      mailbox.innerHTML = '<div class="empty">Could not load your outbox.</div>';
    });
  }
})();
