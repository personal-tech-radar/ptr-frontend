import { chromium } from 'playwright';

const baseUrl = process.env.PTR_FRONTEND_URL ?? 'http://127.0.0.1:4000';
const email = `registration-smoke-${Date.now()}@example.com`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15_000);
const errors = [];
const failedResponses = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('response', (response) => {
  if (response.status() >= 400) {
    failedResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  }
});
try {
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Display name').fill('Registration Smoke');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Repeat email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Test-password-2026');
  await page.getByLabel('Repeat password').fill('Test-password-2026');
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/auth/register'),
  );
  await page.getByRole('button', { name: 'Create account' }).click();
  const response = await responsePromise;
  await page.getByText('Account created').waitFor();
  if (response.status() !== 201) throw new Error(`Registration returned ${response.status()}`);
  const mailboxResponse = await fetch(
    `http://127.0.0.1:3400/api/messages?to=${encodeURIComponent(email)}`,
  );
  const mailbox = await mailboxResponse.json();
  const message = mailbox.data.at(-1);
  const tokenMatch = message?.html?.match(/[?&]token=([^"&<]+)/);
  if (!tokenMatch) throw new Error('Verification email did not contain a token');
  await page.goto(`${baseUrl}/auth/verify-email?token=${decodeURIComponent(tokenMatch[1])}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForURL('**/onboarding');
  await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Your profile' }).waitFor();
  await page.getByRole('button', { name: /Streams/ }).click();
  await page.getByRole('listbox', { name: 'Content streams' }).waitFor();
  await page.screenshot({ path: 'reports/visual/profile-streams-live.png', fullPage: true });
  await page.getByRole('button', { name: /Digest/ }).click();
  await page.getByText('Pick one or both — you can change the rhythm at any time.').waitFor();
  await page.getByRole('button', { name: /Security/ }).click();
  await page.getByLabel('Repeat new password').waitFor();
  await page.getByRole('button', { name: /Danger Zone/ }).click();
  await page.getByRole('button', { name: 'Delete account' }).waitFor();
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/profile');
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/profile');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/radar');
  await page.screenshot({ path: 'reports/visual/radar-signed-in-live.png', fullPage: true });
  await page.goto(`${baseUrl}/not-a-real-route`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/radar');
  console.log(`Registration UI passed (${response.status()})`);
} catch (error) {
  console.error(`URL: ${page.url()}`);
  console.error(`Browser errors: ${errors.join(' | ') || 'none'}`);
  console.error(`Failed responses: ${failedResponses.join(' | ') || 'none'}`);
  console.error((await page.locator('body').innerText()).slice(0, 1200));
  throw error;
} finally {
  await browser.close();
}
