const fs = require('fs');
const path = require('path');
const { createApp } = require('./server');
const { createStore } = require('./lib/store');
const { startBot } = require('./lib/bot');

const flag = process.env.GZCTF_FLAG || 'TriHack{12345678_87654321}'; // not the flag
const store = createStore();
store.seed({ adminPassword: '-S3cur1t11e_Adm1n_do_not_leak_456.79829*' || 'change_me_admin', flag });

const app = createApp({ store });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`protoly listening on ${PORT}`);
  startBot({ store, baseUrl: `http://127.0.0.1:${PORT}` });
});
