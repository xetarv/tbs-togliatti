// Targeted working-tree baseline comparison; no original Git files are changed.
/* global window, document, HTMLImageElement, requestAnimationFrame */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

async function main() {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'artifacts', 'render-batches');
  const baseline = path.join(output, 'baseline');
  const manifest = JSON.parse(fs.readFileSync(path.join(output, 'baseline-manifest.json')));
  const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
  for (const [file, expected] of Object.entries(manifest))
    assert.equal(
      hash(fs.readFileSync(path.join(baseline, file))),
      expected,
      'Baseline modified: ' + file,
    );
  const baselineCommit = 'working-tree-snapshot-with-verified-vegetation';
  const sourceHashes = {
    population: hash(fs.readFileSync(path.join(root, 'src/adapters/world/population.js'))),
  };
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
  let round = 0;
  const reflections = process.argv.includes('--reflections');
  try {
    for (const enabled of process.argv.includes('--probe') ? [false] : [false, true, true, false]) {
      const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
      round++;
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
          '?vegetationCulling=1',
      );
      await page.waitForFunction(() => Boolean(window.__ports), null, { timeout: 60000 });
      await page.evaluate(
        (dt) => {
          window.__renderDt = dt;
        },
        reflections ? 1 / 60 : 0,
      );
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
          const census = {};
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
            if (object.isMesh) {
              const pass =
                material.isMeshDepthMaterial || material.isMeshDistanceMaterial ? 'shadow' : 'main';
              const count = group
                ? group.count
                : Math.min(
                    geometry.drawRange.count,
                    geometry.index?.count ?? geometry.attributes.position.count,
                  );
              draws[pass].calls++;
              draws[pass].triangles += (count / 3) * (object.isInstancedMesh ? object.count : 1);
              const category =
                object.isInstancedMesh &&
                object.geometry === window.__world.unitBox &&
                object.parent === window.__world.scene
                  ? 'static-box-batch'
                  : object.userData.TBS_vegetationCullingR149
                    ? 'vegetation'
                    : object.isInstancedMesh
                      ? 'other-instanced'
                      : geometry.type === 'CircleGeometry'
                        ? 'signal-circle'
                        : 'other-mesh';
              const key = pass + ':' + category;
              census[key] ??= { calls: 0, triangles: 0 };
              census[key].calls++;
              census[key].triangles += (count / 3) * (object.isInstancedMesh ? object.count : 1);
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
            census,
            instances: count,
            renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
            png: renderer.domElement.toDataURL(),
            pixels: Array.from(pixels),
            programsValid: renderer.info.programs.every(
              (program) => program.diagnostics?.runnable !== false,
            ),
          };
        }, view);
        const sessionProfile = await page.context().newCDPSession(page);
        if (process.argv.includes('--probe')) {
          await sessionProfile.send('Profiler.enable');
          await sessionProfile.send('Profiler.start');
          await page.evaluate(async () => {
            for (let i = 0; i < 120; i++) {
              await new Promise((resolve) => requestAnimationFrame(resolve));
              window.__ports.graphics.render(0, window.__ports.timeline.daylight());
            }
          });
          const { profile } = await sessionProfile.send('Profiler.stop');
          fs.writeFileSync(path.join(output, view.name + '-cpu.json'), JSON.stringify(profile));
          const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
          const self = new Map();
          const inclusive = new Map();
          const parents = new Map();
          for (const n of profile.nodes) for (const id of n.children || []) parents.set(id, n.id);
          profile.samples.forEach((id, i) => {
            const dt = profile.timeDeltas[i] / 1000;
            self.set(id, (self.get(id) || 0) + dt);
            while (id) {
              inclusive.set(id, (inclusive.get(id) || 0) + dt);
              id = parents.get(id);
            }
          });
          result.cpu = [...self]
            .map(([id, ms]) => ({
              name: nodes.get(id).callFrame.functionName,
              url: nodes.get(id).callFrame.url,
              line: nodes.get(id).callFrame.lineNumber,
              selfMs: ms,
              inclusiveMs: inclusive.get(id),
            }))
            .sort((a, b) => b.selfMs - a.selfMs)
            .slice(0, 18);
        }
        await sessionProfile.detach();
        const metrics = await page.evaluate(async () => {
          const { renderer, scene } = window.__world;
          const ports = window.__ports;
          for (let i = 0; i < 10; i++) ports.graphics.render(0, ports.timeline.daylight());
          const gl = renderer.getContext();
          const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
          const pending = [];
          const gpuMs = [];
          let disjoint = false;
          function collectQueries() {
            if (!timer) return;
            disjoint ||= Boolean(gl.getParameter(timer.GPU_DISJOINT_EXT));
            for (let i = pending.length - 1; i >= 0; i--) {
              const query = pending[i];
              if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) continue;
              if (!disjoint) gpuMs.push(gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6);
              gl.deleteQuery(query);
              pending.splice(i, 1);
            }
          }
          const intervals = [],
            renderMs = [],
            calls = [],
            triangles = [];
          let previous;
          for (let i = 0; i < 120; i++) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            const start = performance.now();
            if (previous !== undefined) intervals.push(start - previous);
            previous = start;
            collectQueries();
            const query = timer && i % 4 === 0 ? gl.createQuery() : null;
            if (query) gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
            ports.graphics.render(window.__renderDt, ports.timeline.daylight());
            if (query) {
              gl.endQuery(timer.TIME_ELAPSED_EXT);
              pending.push(query);
            }
            renderMs.push(performance.now() - start);
            calls.push(renderer.info.render.calls);
            triangles.push(renderer.info.render.triangles);
          }
          const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
          for (let i = 0; pending.length && i < 20; i++) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            collectQueries();
          }
          for (const query of pending) gl.deleteQuery(query);
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
            gpuMs: timer && !disjoint && gpuMs.length ? mean(gpuMs) : null,
            gpuSamples: disjoint ? 0 : gpuMs.length,
            gpuTimerAvailable: Boolean(timer),
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
          round,
          recurringReflections: reflections,
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
    fs.writeFileSync(
      path.join(
        output,
        process.argv.includes('--probe')
          ? 'probe.json'
          : reflections
            ? 'comparison-reflections.json'
            : 'comparison.json',
      ),
      JSON.stringify(results, null, 2),
    );
    console.log(
      JSON.stringify(
        results.map((r) => ({
          view: r.view,
          enabled: r.enabled,
          round: r.round,
          fps: r.metrics.fps,
          frameMs: r.metrics.frameMs,
          calls: r.metrics.calls,
          gpuMs: r.metrics.gpuMs,
        })),
      ),
    );
    if (process.argv.includes('--probe')) return;
    for (const after of results) {
      const before = results.find((result) => !result.enabled && result.view === after.view);
      assert.equal(after.instances, before.instances, 'Instance density must not change.');
      for (const key of ['matrixBytes', 'colorBytes', 'instancedMeshes'])
        assert.equal(after.metrics[key], before.metrics[key], key + ' must not change.');
      assert.equal(after.renderer, before.renderer, 'GPU backends must match.');
      assert.equal(
        after.pixelHash,
        before.pixelHash,
        `${before.view}: framebuffer pixels must match.`,
      );
      if (after.enabled) assert.ok(after.draws.main.calls < before.draws.main.calls);
      console.log(
        JSON.stringify({
          view: before.view,
          identicalPixels: true,
          instances: after.instances,
          round: after.round,
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
