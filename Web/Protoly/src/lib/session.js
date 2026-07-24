const { randomBytes } = require('crypto');

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function sessionMiddleware(store) {
  return (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    let sid = cookies.sid;
    if (!sid || !store.sessions.has(sid)) {
      sid = randomBytes(16).toString('hex');
      store.sessions.set(sid, {
        userId: null,
        mfaPassed: false,
        csrf: randomBytes(16).toString('hex'),
      });
      res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`);
    }
    req.sid = sid;
    req.session = store.sessions.get(sid);
    next();
  };
}

module.exports = { sessionMiddleware, parseCookies };
