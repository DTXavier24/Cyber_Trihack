const { randomBytes } = require('crypto');
const puppeteer = require('puppeteer-core');

function startBot({ store, baseUrl, intervalMs = 1000 }) {
  let stopped = false;
  let browser = null;

  async function ensureBrowser() {
    if (!browser) {
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return browser;
  }

  function adminCookie() {
    const sid = randomBytes(16).toString('hex');
    store.sessions.set(sid, { userId: store.adminId, mfaPassed: true, csrf: randomBytes(16).toString('hex') });
    const { hostname } = new URL(baseUrl);
    return { name: 'sid', value: sid, domain: hostname, path: '/', httpOnly: true };
  }

  async function visit(pathToOpen) {
    const b = await ensureBrowser();
    const page = await b.newPage();
    try {
      await page.setCookie(adminCookie());
      await page.goto(baseUrl + pathToOpen, { waitUntil: 'networkidle0', timeout: 8000 });
      await new Promise((r) => setTimeout(r, 1500)); 
    } catch (e) {

    } finally {
      await page.close().catch(() => {});
    }
  }

  (async function loop() {
    while (!stopped) {
      const pathToOpen = store.reportQueue.shift();
      if (pathToOpen) await visit(pathToOpen);
      else await new Promise((r) => setTimeout(r, intervalMs));
    }
  })();

  return {
    stop: async () => { stopped = true; if (browser) await browser.close().catch(() => {}); },
  };
}

module.exports = { startBot };
