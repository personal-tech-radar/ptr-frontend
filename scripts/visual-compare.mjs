import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'reports/visual';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const pages = [
  ['landing', 'Personal%20Tech%20Radar.dc.html', ''],
  ['register', 'Registration.dc.html', 'register'],
  ['login', 'Login.dc.html', 'login'],
  ['onboarding', 'Onboarding.dc.html', 'onboarding'],
  ['profile', 'Profile.dc.html', 'profile'],
  ['radar', 'Personal%20Tech%20Radar%20-%20Signed%20In.dc.html', 'radar'],
];
for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport });
  const appContext = await browser.newContext({ viewport, javaScriptEnabled: false });
  for (const [name, design, route] of pages) {
    const designPage = await context.newPage();
    await designPage.goto(`http://127.0.0.1:4100/${design}`, { waitUntil: 'networkidle' });
    await designPage.screenshot({
      path: `${output}/${name}-${viewport.name}-design.png`,
      fullPage: true,
    });
    const appPage = await appContext.newPage();
    await appPage.goto(`http://127.0.0.1:4000/${route}`, { waitUntil: 'networkidle' });
    await appPage.screenshot({
      path: `${output}/${name}-${viewport.name}-app.png`,
      fullPage: true,
    });
    await Promise.all([designPage.close(), appPage.close()]);
  }
  await context.close();
  await appContext.close();
}
await browser.close();
