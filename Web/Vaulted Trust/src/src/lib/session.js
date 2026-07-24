const cookie = require("cookie");
const { hmac, timingSafeEqualHex } = require("./crypto");

function encodeSession(secret, userId) {
  const body = Buffer.from(JSON.stringify({ userId, issuedAt: Date.now() })).toString("base64url");
  return `${body}.${hmac(secret, body)}`;
}

function decodeSession(secret, header) {
  const cookies = cookie.parse(header || "");
  const token = cookies.sequri_session;
  if (!token || !token.includes(".")) {
    return null;
  }

  const [body, sig] = token.split(".", 2);
  if (!timingSafeEqualHex(sig, hmac(secret, body))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function setSessionCookie(res, secret, userId) {
  res.setHeader("Set-Cookie", cookie.serialize("sequri_session", encodeSession(secret, userId), {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 3600
  }));
}

module.exports = { decodeSession, setSessionCookie };
