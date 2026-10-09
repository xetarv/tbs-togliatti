const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const target = path.resolve(process.argv[2] || projectRoot);
  const executablePath =
    process.env.TBS_BROWSER ||
    [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
    ].find((candidate) => fs.existsSync(candidate));
  assert.ok(executablePath, 'Set TBS_BROWSER to a Chromium browser executable.');
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--enable-webgl', '--enable-unsafe-swiftshader'],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', (request) => failedRequests.push(request.url()));
    await page.goto(pathToFileURL(path.join(target, 'index.html')).href);
    await page.waitForFunction(
      () => {
        return (
          document.getElementById('missionTitle').textContent === 'Контур будущего' ||
          document.getElementById('toast').textContent.startsWith('Ошибка')
        );
      },
      null,
      { timeout: 60000 },
    );
    assert.deepEqual(errors, [], 'Startup errors: ' + errors.join('; '));
    assert.equal(await page.locator('#startBtn').isEnabled(), true);
    assert.equal(await page.locator('#overlay').isVisible(), true);
    await page.locator('#qualitySelect').selectOption('low');
    await page.locator('#startBtn').click();
    assert.equal(await page.locator('#overlay').isVisible(), false);
    await page.keyboard.down('KeyW');
    await page.waitForFunction(
      () => parseInt(document.getElementById('speed').textContent, 10) > 5,
    );
    await page.keyboard.up('KeyW');
    await page.keyboard.press('KeyP');
    assert.equal(await page.locator('#overlay').isVisible(), true);
    await page.locator('#startBtn').click();
    await page.locator('#cameraBtn').click();
    assert.equal(await page.locator('#cameraBtn').getAttribute('aria-pressed'), 'true');
    await page.locator('#daylightBtn').click();
    assert.match(await page.locator('#daylightBtn').getAttribute('title'), /Вечер/);
    await page.locator('#soundBtn').click();
    assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'), 'true');
    await page.setViewportSize({ width: 640, height: 480 });
    await page.keyboard.press('KeyE');
    for (const quality of ['medium', 'high']) {
      await page.locator('#qualitySelect').selectOption(quality);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      assert.equal(await page.locator('#qualitySelect').inputValue(), quality);
    }
    const artifactDir = path.join(projectRoot, 'artifacts');
    fs.mkdirSync(artifactDir, { recursive: true });
    const screenshotName = target === projectRoot ? 'refactored.png' : 'baseline.png';
    await page.screenshot({ path: path.join(artifactDir, screenshotName) });
    assert.deepEqual(failedRequests, [], 'All local resources must load.');
    assert.deepEqual(errors, [], 'No browser or WebGL errors are expected.');
    await context.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await mobileContext.newPage();
    mobile.on('pageerror', (error) => errors.push(error.message));
    mobile.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    mobile.on('requestfailed', (request) => failedRequests.push(request.url()));
    await mobile.goto(pathToFileURL(path.join(target, 'index.html')).href + '?play');
    await mobile.waitForFunction(
      () => document.getElementById('missionTitle').textContent === 'Контур будущего',
    );
    assert.equal(await mobile.locator('#overlay').isVisible(), false);
    assert.equal(await mobile.locator('#qualitySelect').inputValue(), 'low');
    const accelerator = mobile.locator('.touch .go');
    assert.equal(await accelerator.isVisible(), true);
    const bounds = await accelerator.boundingBox();
    const session = await mobileContext.newCDPSession(mobile);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
    });
    await mobile.waitForFunction(
      () => parseInt(document.getElementById('speed').textContent, 10) > 0,
    );
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(
      await accelerator.evaluate((element) => element.classList.contains('active')),
      false,
    );
    await mobile.screenshot({ path: path.join(artifactDir, 'mobile.png') });
    assert.deepEqual(failedRequests, [], 'All mobile resources must load.');
    assert.deepEqual(errors, [], 'The mobile game must run without errors.');
    await mobileContext.close();
    console.log(
      'Browser check passed: offline launch, driving, pause, camera, lighting, audio, resize, all graphics presets, mobile touch controls.',
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
