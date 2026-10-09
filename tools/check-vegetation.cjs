// Short deterministic Git-baseline comparison and frozen render-loop sampling.
/* global window, document, HTMLImageElement, requestAnimationFrame */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');
const { execFileSync } = require('node:child_process');

async function main() {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'artifacts', 'vegetation-culling');
  fs.mkdirSync(output, { recursive: true });
  const baseline = path.resolve(process.argv[2] || path.join(output, 'baseline-aa61f93'));
  assert.ok(
    fs.existsSync(path.join(baseline, 'index.html')),
    'Export Git commit aa61f93 to a separate baseline folder first.',
  );
  const git =
    process.env.TBS_GIT || path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'cmd', 'git.exe');
  const baselineCommit = execFileSync(git, ['rev-parse', 'aa61f93'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const tracked = execFileSync(git, ['ls-tree', '-r', baselineCommit], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n');
  for (const line of tracked) {
    const [metadata, file] = line.split('\t');
    const expected = metadata.split(' ')[2];
    const bytes = fs.readFileSync(path.join(baseline, file));
    const actual = crypto
      .createHash('sha1')
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest('hex');
    assert.equal(actual, expected, `Baseline differs from ${baselineCommit}: ${file}`);
  }
  const sourceHashes = Object.fromEntries(
    ['src/adapters/rendering/vegetation-culling.js', 'src/adapters/world/terrain.js'].map(
      (file) => [
        file,
        crypto
          .createHash('sha256')
          .update(fs.readFileSync(path.join(root, file)))
          .digest('hex'),
      ],
    ),
  );
  const executablePath =
    process.env.TBS_BROWSER ||
    [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ].find((file) => fs.existsSync(file));
  assert.ok(executablePath, 'Set TBS_BROWSER to a Chromium executable.');
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      '--use-angle=' + (process.env.TBS_TEST_ANGLE || 'swiftshader'),
      '--enable-webgl',
      '--enable-precise-memory-info',
      '--enable-unsafe-swiftshader',
    ],
  });
  const results = [];
  try {
    for (const enabled of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) => errors.push(request.url()));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.addInitScript(() => {
        let seed = 72421;
        Math.random = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        let api;
        Object.defineProperty(window, 'TBS', {
          get: () => api,
          set(value) {
            api = value;
            for (const name of ['buildWorld', 'buildPresentation', 'createRuntime']) {
              let fn;
              Object.defineProperty(api, name, {
                get: () => fn,
                set(original) {
                  fn = (...args) => {
                    const result = original(...args);
                    if (name === 'buildWorld') window.__world = result;
                    if (name === 'buildPresentation') window.__ports = result;
                    // Freeze all simulation and camera updates for image comparison.
                    return name === 'createRuntime' ? { ...result, start() {} } : result;
                  };
                },
              });
            }
          },
        });
      });
      await page.goto(
        pathToFileURL(path.join(enabled ? root : baseline, 'index.html')).href +
          '?vegetationCulling=' +
          Number(enabled),
      );
      await page.waitForFunction(() => Boolean(window.__ports), null, { timeout: 60000 });
      const views = [
        { name: 'start-day', position: [77, 8, 40], target: [55, 3, 28], night: false },
        { name: 'waterfront-night', position: [94, 7, 30], target: [115, 2, 0], night: true },
        { name: 'bank-day', position: [25, 12, -40], target: [55, 1, -65], night: false },
      ];
      for (const view of views) {
        const result = await page.evaluate(async (view) => {
          const { scene, camera, renderer, visualAssets } = window.__world;
          const ports = window.__ports;
          if (view.name === 'waterfront-night') {
            document.getElementById('daylightBtn').click();
            document.getElementById('daylightBtn').click();
          } else if (view.name === 'bank-day') {
            document.getElementById('daylightBtn').click();
            document.getElementById('daylightBtn').click();
          }
          ports.lighting.updateLighting(30);
          camera.position.fromArray(view.position);
          camera.lookAt(...view.target);
          camera.updateMatrixWorld();
          visualAssets.wind.value = 12;
          ports.graphics.setQuality('high');
          // Await local textures; no timers or performance sampling.
          const images = new Set();
          scene.traverse((object) => {
            for (const material of [object.material].flat()) {
              if (material)
                for (const key of ['map', 'normalMap', 'roughnessMap']) {
                  const image = material[key]?.image;
                  if (image instanceof HTMLImageElement && !image.complete) images.add(image);
                }
            }
          });
          await Promise.all(
            [...images].map(
              (image) =>
                new Promise((resolve, reject) => {
                  image.addEventListener('load', resolve, { once: true });
                  image.addEventListener('error', reject, { once: true });
                }),
            ),
          );
          ports.graphics.render(0.16, ports.timeline.daylight());
          const draws = { main: { calls: 0, triangles: 0 }, shadow: { calls: 0, triangles: 0 } };
          const original = renderer.renderBufferDirect;
          renderer.renderBufferDirect = function (
            camera,
            scene,
            geometry,
            material,
            object,
            group,
          ) {
            if (object.isInstancedMesh) {
              const pass =
                material.isMeshDepthMaterial || material.isMeshDistanceMaterial ? 'shadow' : 'main';
              const count = group
                ? group.count
                : Math.min(
                    geometry.drawRange.count,
                    geometry.index?.count ?? geometry.attributes.position.count,
                  );
              draws[pass].calls++;
              draws[pass].triangles += (count / 3) * object.count;
            }
            return original.call(this, camera, scene, geometry, material, object, group);
          };
          ports.graphics.render(0, ports.timeline.daylight());
          renderer.renderBufferDirect = original;
          const gl = renderer.getContext(),
            pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
          gl.readPixels(
            0,
            0,
            gl.drawingBufferWidth,
            gl.drawingBufferHeight,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels,
          );
          let count = 0;
          scene.traverse((object) => {
            if (object.isInstancedMesh) count += object.count;
          });
          const debug = gl.getExtension('WEBGL_debug_renderer_info');
          return {
            draws,
            instances: count,
            renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
            png: renderer.domElement.toDataURL(),
            pixels: Array.from(pixels),
            programsValid: renderer.info.programs.every(
              (program) => program.diagnostics?.runnable !== false,
            ),
          };
        }, view);
        const metrics = await page.evaluate(async () => {
          const { renderer, scene } = window.__world;
          const ports = window.__ports;
          for (let i = 0; i < 10; i++) ports.graphics.render(0, ports.timeline.daylight());
          const intervals = [],
            renderMs = [],
            calls = [],
            triangles = [];
          let previous;
          for (let i = 0; i < 180; i++) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            const start = performance.now();
            if (previous !== undefined) intervals.push(start - previous);
            previous = start;
            ports.graphics.render(0, ports.timeline.daylight());
            renderMs.push(performance.now() - start);
            calls.push(renderer.info.render.calls);
            triangles.push(renderer.info.render.triangles);
          }
          const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
          const sorted = intervals.slice().sort((a, b) => a - b);
          let matrixBytes = 0,
            colorBytes = 0,
            instancedMeshes = 0;
          scene.traverse((o) => {
            if (o.isInstancedMesh) {
              instancedMeshes++;
              matrixBytes += o.instanceMatrix.array.byteLength;
              colorBytes += o.instanceColor?.array.byteLength ?? 0;
            }
          });
          return {
            frames: intervals.length,
            fps: 1000 / mean(intervals),
            frameMs: mean(intervals),
            p95Ms: sorted[Math.floor(sorted.length * 0.95)],
            renderMs: mean(renderMs),
            calls: mean(calls),
            triangles: mean(triangles),
            heapBytes: performance.memory?.usedJSHeapSize ?? null,
            matrixBytes,
            colorBytes,
            instancedMeshes,
            resources: { ...renderer.info.memory },
          };
        });
        const session = await page.context().newCDPSession(page);
        await session.send('HeapProfiler.collectGarbage');
        metrics.retainedHeapBytes = await page.evaluate(
          () => performance.memory?.usedJSHeapSize ?? null,
        );
        await session.detach();
        result.metrics = metrics;
        const pixels = Buffer.from(result.pixels);
        delete result.pixels;
        fs.writeFileSync(
          path.join(output, `${view.name}-${enabled ? 'on' : 'off'}.png`),
          Buffer.from(result.png.split(',')[1], 'base64'),
        );
        delete result.png;
        result.pixelHash = crypto.createHash('sha256').update(pixels).digest('hex');
        result.nonemptyPixels = pixels.some((value, index) => index % 4 !== 3 && value !== 0);
        assert.ok(result.nonemptyPixels);
        assert.ok(result.programsValid);
        results.push({
          enabled,
          baselineCommit,
          sourceHashes,
          viewport: [1024, 768],
          quality: 'high',
          frozenSimulation: true,
          view: view.name,
          ...result,
        });
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'comparison.json'), JSON.stringify(results, null, 2));
    for (const before of results.filter((result) => !result.enabled)) {
      const after = results.find((result) => result.enabled && result.view === before.view);
      assert.equal(after.instances, before.instances, 'Vegetation density must not change.');
      assert.equal(after.renderer, before.renderer, 'GPU backends must match.');
      assert.equal(
        after.pixelHash,
        before.pixelHash,
        `${before.view}: framebuffer pixels must match.`,
      );
      assert.ok(after.draws.main.triangles < before.draws.main.triangles);
      console.log(
        JSON.stringify({
          view: before.view,
          identicalPixels: true,
          instances: after.instances,
          before: before.draws,
          after: after.draws,
          baseline: before.metrics,
          current: after.metrics,
        }),
      );
    }
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
