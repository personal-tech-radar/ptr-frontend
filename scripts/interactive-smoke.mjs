import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:4000', { waitUntil: 'networkidle' });
await page
  .getByRole('button', { name: /Interests/ })
  .first()
  .click();
await page.getByRole('dialog', { name: 'Interests' }).waitFor();
const preview = page.waitForResponse(
  (response) =>
    response.request().method() === 'POST' && response.url().includes('/api/public/feed/preview'),
);
await page.getByRole('option').first().click();
if (!(await preview).ok()) throw new Error('Public preview request failed');
await page.screenshot({ path: 'reports/visual/landing-filter-open.png', fullPage: false });

await page.goto('http://127.0.0.1:4000/register', { waitUntil: 'networkidle' });
await page.getByLabel('Email', { exact: true }).fill('invalid');
await page.getByLabel('Repeat email').fill('different@example.com');
await page.getByLabel('Password', { exact: true }).fill('short');
await page.getByLabel('Repeat password').fill('different');
await page.getByLabel('Repeat password').blur();
for (const text of [
  '! not a valid address',
  '! addresses do not match',
  '! use at least 8 characters',
  '! passwords do not match',
]) {
  await page.getByText(text, { exact: true }).waitFor();
}
await page.screenshot({ path: 'reports/visual/register-validation.png', fullPage: false });
await browser.close();
