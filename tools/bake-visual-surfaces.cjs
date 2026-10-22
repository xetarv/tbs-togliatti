// Bake only the four existing deterministic surfaces. The procedural factory remains canonical.
/* global window */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

async function main() {
  const root = path.resolve(__dirname, '..');
  const output = path.resolve(process.argv[2] || 'assets/visual-surfaces-embedded.js');
  const evidence = path.resolve(process.argv[3] || 'artifacts/visual-surface-bake');
  assert.ok(!fs.existsSync(output), 'Use a fresh output, then review before replacing an asset.');
  assert.ok(!fs.existsSync(evidence), 'Use a fresh evidence directory.');
  fs.mkdirSync(evidence, { recursive: true });
  const html = path.join(evidence, 'bake.html');
  fs.writeFileSync(html, '<!doctype html><meta charset="utf-8"><script>window.TBS={};</script>');
  const context = await chromium.launchPersistentContext(path.join(evidence, 'profile'), {
    executablePath:
      process.env.TBS_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: false,
    args: ['--use-angle=d3d11', '--enable-webgl'],
    ignoreDefaultArgs: ['--enable-unsafe-swiftshader'],
  });
  try {
    const page = context.pages()[0];
    await page.goto(pathToFileURL(html).href);
    await page.addScriptTag({ url: pathToFileURL(path.join(root, 'assets/three.min.js')).href });
    await page.addScriptTag({
      url: pathToFileURL(path.join(root, 'dist/adapters/world/visual-assets.js')).href,
    });
    const data = await page.evaluate(async () => {
      const T = window.THREE;
      T.ColorManagement.legacyMode = false;
      const imul = Math.imul,
        ctor = T.CanvasTexture,
        images = [],
        records = [];
      let calls = 0,
        previousCalls = 0,
        previousSeed = 81231,
        lastSeed = previousSeed;
      Math.imul = function (a, b) {
        const result = imul(a, b);
        if (b === 1664525) {
          calls++;
          lastSeed = (result + 1013904223) >>> 0;
        }
        return result;
      };
      T.CanvasTexture = new Proxy(ctor, {
        construct(target, args, newTarget) {
          const result = Reflect.construct(target, args, newTarget);
          if (images.length < 12) {
            images.push(args[0]);
            if (images.length % 3 === 0) {
              records.push({
                beforeSeed: previousSeed,
                afterSeed: lastSeed,
                randomCalls: calls - previousCalls,
              });
              previousCalls = calls;
              previousSeed = lastSeed;
            }
          }
          return result;
        },
      });
      try {
        window.TBS.createVisualAssets(T, { capabilities: { getMaxAnisotropy: () => 16 } }, {});
      } finally {
        Math.imul = imul;
        T.CanvasTexture = ctor;
      }
      const rgbaHash = async (c) =>
        Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              'SHA-256',
              c.getContext('2d').getImageData(0, 0, 512, 512).data,
            ),
          ),
        )
          .map((v) => v.toString(16).padStart(2, '0'))
          .join('');
      const instrumented = await Promise.all(images.map(rgbaHash));
      // Observe RNG in the first pass only. Bake pixels with the native intrinsic restored.
      images.length = 0;
      T.CanvasTexture = new Proxy(ctor, {
        construct(target, args, newTarget) {
          const result = Reflect.construct(target, args, newTarget);
          if (images.length < 12) images.push(args[0]);
          return result;
        },
      });
      try {
        window.TBS.createVisualAssets(T, { capabilities: { getMaxAnisotropy: () => 16 } }, {});
      } finally {
        T.CanvasTexture = ctor;
      }
      const plain = await Promise.all(images.map(rgbaHash));
      return {
        records,
        png: images.map((c) => c.toDataURL('image/png')),
        rasterization: plain.map((sha256, i) => ({ instrumented: instrumented[i], plain: sha256 })),
      };
    });
    assert.equal(data.records.length, 4);
    assert.equal(data.png.length, 12);
    const kinds = ['asphalt', 'stone', 'paving', 'brick'];
    const keys = ['map', 'normalMap', 'roughnessMap'];
    const library = {},
      files = [];
    for (let i = 0; i < kinds.length; i++) {
      const images = {};
      for (let j = 0; j < keys.length; j++) {
        const url = data.png[i * 3 + j],
          bytes = Buffer.from(url.split(',')[1], 'base64');
        const name = `${kinds[i]}-${keys[j]}.png`;
        fs.writeFileSync(path.join(evidence, name), bytes, { flag: 'wx' });
        images[keys[j]] = url;
        files.push({
          name,
          bytes: bytes.length,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
        });
      }
      library[kinds[i]] = { ...data.records[i], images };
    }
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(
      output,
      '/* Four deterministic 512x512 surfaces; regenerate with tools/bake-visual-surfaces.cjs. */\nwindow.TBS_VISUAL_SURFACES = ' +
        JSON.stringify(library) +
        ';\n',
      { flag: 'wx' },
    );
    fs.writeFileSync(
      path.join(evidence, 'manifest.json'),
      JSON.stringify(
        {
          browser: context.browser().version(),
          sourceSHA256: crypto
            .createHash('sha256')
            .update(fs.readFileSync(path.join(root, 'dist/adapters/world/visual-assets.js')))
            .digest('hex'),
          seeds: data.records,
          rasterization: data.rasterization,
          files,
          embeddedBytes: fs.statSync(output).size,
        },
        null,
        2,
      ),
      { flag: 'wx' },
    );
    console.log(
      JSON.stringify({
        output,
        images: files.length,
        embeddedBytes: fs.statSync(output).size,
        seeds: data.records,
      }),
    );
  } finally {
    await context.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
