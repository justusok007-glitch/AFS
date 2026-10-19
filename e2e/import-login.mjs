import { chromium } from 'playwright';
const BASE = 'http://localhost:4173/';
const log = (...a) => { const m = a.join(' ').replace(/[\r\n%]/g, ' ').slice(0, 900); console.log('[e2e]', m); console.log(`::notice title=e2e::${m}`); };
const browser = await chromium.launch();
import { readFileSync } from 'node:fs';
const oldDb = process.env.OLD_DB ? readFileSync('e2e/old-db.json', 'utf8') : null;
const context = await browser.newContext({ viewport: { width: 400, height: 850 } });
if (oldDb) await context.addInitScript((db) => { if (!localStorage.getItem('afs_okara_local_db_v2')) localStorage.setItem('afs_okara_local_db_v2', db); }, oldDb);
const page = await context.newPage();
log('scenario:', oldDb ? 'OLD DATA PRESENT' : 'CLEAN');
page.on('pageerror', (e) => log('PAGEERROR', e.message));
const text = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 600);
async function login(id, pw) {
  const idBox = page.getByPlaceholder(/e\.g\. PR01/);
  await idBox.waitFor({ timeout: 20000 });
  await idBox.fill(id);
  await page.locator('input[type=password]').fill(pw);
  await page.getByRole('button', { name: /Sign In to Portal/ }).click();
  await page.waitForTimeout(1500);
}
async function dump(label) {
  const db = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      if (v && v.includes('passwordsByUserId')) {
        const d = JSON.parse(v);
        return { key: k, students: d.students.length, parents: d.profiles.filter((p) => p.role === 'PARENT').map((p) => [p.id, p.loginId, d.passwordsByUserId[p.id]]), classes: d.classes.length, flag: d.cleanStart };
      }
    }
    return null;
  });
  log(label, JSON.stringify(db));
}
try {
  await page.goto(BASE);
  await login('AD01', 'demo1234');
  log('after admin login:', await text());
  await dump('db after admin login');
  await page.getByText('Students', { exact: true }).last().click();
  await page.waitForTimeout(800);
  await page.getByText('Import students (CSV)').click();
  await page.waitForTimeout(500);
  await page.setInputFiles('input[type=file]', 'e2e/students.csv');
  await page.getByText(/valid rows/).waitFor({ timeout: 20000 });
  log('preview:', await text());
  await page.getByRole('button', { name: /^Import students/ }).click();
  await page.getByText(/Students imported/).waitFor({ timeout: 20000 });
  log('imported:', await text());
  await dump('db after import');
  await page.reload();
  await page.waitForTimeout(2500);
  await dump('db after reload');
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/session/i.test(k)) localStorage.removeItem(k); });
  await page.reload();
  await login('asf@1001', '1001');
  const t = await text();
  log('parent login result:', t);
  log(/Incorrect/i.test(t) ? 'RESULT: LOGIN FAILED' : 'RESULT: LOGIN OK');
} catch (e) {
  log('ERROR', e.message);
  log('page text:', await text());
  await page.screenshot({ path: 'e2e-fail.png' });
  process.exitCode = 1;
}
await browser.close();
