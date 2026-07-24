const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');

function createStore() {
  const store = {
    users: new Map(),
    sessions: new Map(),
    mailboxes: new Map(),
    resetTokens: new Map(),
    pendingCodes: {}, 
    reportQueue: [],
    flag: '',
    adminId: 'admin',
  };

  store.hashPassword = (pw) => {
    const salt = randomBytes(8).toString('hex');
    const hash = scryptSync(pw, salt, 32).toString('hex');
    return `${salt}:${hash}`;
  };
  store.verifyPassword = (pw, stored) => {
    if (typeof stored !== 'string' || !stored.includes(':')) return false;
    const [salt, hash] = stored.split(':');
    const calc = scryptSync(pw, salt, 32);
    const known = Buffer.from(hash, 'hex');
    return calc.length === known.length && timingSafeEqual(calc, known);
  };

  let nextId = 1;
  store.createUser = ({ username, email, password, isAdmin = false, id }) => {
    const user = {
      id: id || `u${nextId++}`,
      username,
      email,
      passwordHash: store.hashPassword(password),
      isAdmin,
    };
    store.users.set(user.id, user);
    return user;
  };
  store.findByUsername = (username) =>
    [...store.users.values()].find((u) => u.username === username);

  store.sendMail = (to, { subject, body, link }) => {
    if (!store.mailboxes.has(to)) store.mailboxes.set(to, []);
    store.mailboxes.get(to).push({ subject, body, link });
  };

  store.seed = ({ adminPassword, flag }) => {
    store.flag = flag;
    store.createUser({
      id: 'admin',
      username: 'admin',
      email: 'admin@protoly.local',
      password: adminPassword,
      isAdmin: true,
    });
  };

  return store;
}

module.exports = { createStore };
