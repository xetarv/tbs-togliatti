// Dynamic full-game profiling with deterministic controls, not frozen rendering.
/* global window, requestAnimationFrame, PointerEvent, HTMLImageElement */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execute = promisify(execFile);
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

async function main() {
  const root = path.resolve(__dirname, '..');
  const archive = path.resolve(
    root,
    process.argv.find((a) => a.startsWith('--baseline-dir='))?.slice(15) ||
      'artifacts/driving-profile',
  );
  const output = path.resolve(
    root,
    process.argv.find((a) => a.startsWith('--output='))?.slice(9) || 'artifacts/driving-profile',
  );
  fs.mkdirSync(output, { recursive: true });
  const baseline = path.join(archive, 'baseline');
  const manifest = JSON.parse(fs.readFileSync(path.join(archive, 'baseline-manifest.json')));
  const mode = process.argv.find((a) => a.startsWith('--signal-mode='))?.slice(14);
  const diagnose = process.argv.includes('--diagnose');
  const visualSamples = process.argv.includes('--visual-samples');
  const passes = process.argv.includes('--passes');
  for (const [file, sha] of Object.entries(manifest))
    assert.equal(
      hash(fs.readFileSync(path.join(baseline, file))),
      sha,
      'Baseline changed: ' + file,
    );
  const probe = process.argv.includes('--probe');
  const verify = process.argv.includes('--verify');
  const browser = await chromium.launch({
    executablePath: process.env.TBS_BROWSER,
    headless: true,
    args: ['--use-angle=d3d11', '--enable-webgl', '--enable-precise-memory-info'],
  });
  const routes = [
    {
      name: 'city-day',
      start: [68, 70],
      points: [
        [110, 70],
        [110, 110],
        [152, 110],
        [152, 150],
      ],
      night: false,
    },
    {
      name: 'waterfront-night',
      start: [110, 30],
      points: [
        [152, 30],
        [152, 70],
        [194, 70],
        [194, 110],
      ],
      night: true,
    },
  ];
  const results = [];
  const order = visualSamples
    ? [false, true]
    : process.argv.includes('--three-repeats')
      ? [false, true, true, false, false, true]
      : [false, true, true, false];
  let round = 0;
  try {
    for (const after of verify ? [true] : probe ? [false] : order) {
      round++;
      for (const route of routes) {
        const onlyRoute = process.argv.find((arg) => arg.startsWith('--route='))?.slice(8);
        if (onlyRoute && route.name !== onlyRoute) continue;
        const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('requestfailed', (r) => errors.push(r.url()));
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text());
        });
        await page.addInitScript(() => {
          let seed = 72421,
            api;
          Math.random = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return seed / 4294967296;
          };
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
                      if (name === 'buildPresentation') {
                        window.__ports = result;
                        window.__state = args[0].state;
                        window.__traffic = args[0].traffic;
                      }
                      if (name === 'createRuntime') {
                        window.__game = args[0].game;
                        // The harness owns rAF scheduling and calls the full game step.
                        return {
                          ...result,
                          start() {
                            window.__game.initialize();
                          },
                        };
                      }
                      return result;
                    };
                  },
                });
              }
            },
          });
        });
        const url = pathToFileURL(path.join(after ? root : baseline, 'index.html'));
        if (after && mode) url.searchParams.set('signalHousingBatching', mode);
        await page.goto(url.href);
        await page.waitForFunction(() => Boolean(window.__game), null, { timeout: 60000 });
        await page.evaluate(async (route) => {
          const { scene, renderer } = window.__world;
          const images = new Set();
          scene.traverse((o) => {
            for (const m of [o.material].flat())
              if (m)
                for (const key of ['map', 'normalMap', 'roughnessMap']) {
                  const image = m[key]?.image;
                  if (image instanceof HTMLImageElement && !image.complete) images.add(image);
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
          window.__ports.graphics.setQuality('high');
          Object.assign(window.__state.player, {
            x: route.start[0],
            z: route.start[1],
            heading: Math.PI / 2,
            speed: 0,
            battery: 100,
            slip: 0,
          });
          renderer.domElement.addEventListener('pointerdown', (e) => {
            window.__pointerId = e.pointerId;
          });
        }, route);
        await page.click('#startBtn');
        if (route.night) {
          await page.click('#daylightBtn');
          await page.click('#daylightBtn');
        }
        await page.evaluate(async () => {
          for (let i = 0; i < 120; i++) {
            await new Promise((r) => requestAnimationFrame(r));
            window.__game.step(1 / 60);
          }
        });
        await page.click('#cameraBtn');
        await page.mouse.move(470, 450);
        await page.mouse.down();
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Performance.enable');
        const beforePerformance = await cdp.send('Performance.getMetrics');
        if (probe && !process.argv.includes('--census')) {
          await cdp.send('Profiler.enable');
          await cdp.send('Profiler.start');
        }
        const telemetry = [];
        let reading = false;
        const sampleGPU = async () => {
          if (reading) return;
          reading = true;
          try {
            const { stdout } = await execute(
              'C:/Windows/System32/nvidia-smi.exe',
              [
                '--query-gpu=timestamp,name,pstate,utilization.gpu,clocks.current.graphics,temperature.gpu,power.draw',
                '--format=csv,noheader',
              ],
              { windowsHide: true, timeout: 3000 },
            );
            telemetry.push({ time: Date.now(), value: stdout.trim() });
          } catch (e) {
            telemetry.push({ error: e.message });
          } finally {
            reading = false;
          }
        };
        await sampleGPU();
        const telemetryTimer = setInterval(sampleGPU, 2000);
        const result = await page
          .evaluate(
            async ({ route, probe, visualSamples, passes }) => {
              const { scene, renderer, camera } = window.__world,
                ports = window.__ports;
              const { player, keys } = window.__state;
              const gl = renderer.getContext(),
                timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
              const pending = [],
                gpu = [],
                frames = [],
                visual = [],
                trace = [],
                timings = {},
                census = {};
              const censusDetails = {},
                materialCensus = {},
                passGpu = {},
                queryLabels = new Map();
              let focus = 'total',
                activeTimer = null;
              function begin(label) {
                // PMREM may invoke renderer.render recursively. Timer queries
                // cannot nest; its GPU work belongs to the enclosing pass.
                if (!timer || activeTimer) return null;
                const q = gl.createQuery();
                queryLabels.set(q, label);
                gl.beginQuery(timer.TIME_ELAPSED_EXT, q);
                activeTimer = q;
                return q;
              }
              function end(q) {
                if (!q) return;
                gl.endQuery(timer.TIME_ELAPSED_EXT);
                activeTimer = null;
                pending.push(q);
              }
              let disjoint = false;
              function collect() {
                if (!timer) return;
                disjoint ||= Boolean(gl.getParameter(timer.GPU_DISJOINT_EXT));
                for (let i = pending.length - 1; i >= 0; i--) {
                  const q = pending[i];
                  if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) continue;
                  if (!disjoint) {
                    const ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
                    const label = queryLabels.get(q) || 'total';
                    if (label === 'total') gpu.push(ms);
                    else (passGpu[label] ||= []).push(ms);
                  }
                  queryLabels.delete(q);
                  gl.deleteQuery(q);
                  pending.splice(i, 1);
                }
              }
              const restores = [];
              if (passes) {
                const render = renderer.render,
                  shadow = renderer.shadowMap.render;
                renderer.render = function (renderedScene, renderedCamera) {
                  const label =
                    renderedScene === scene
                      ? 'main-with-shadows'
                      : renderedCamera.isOrthographicCamera &&
                          renderedScene.children.some(
                            (o) =>
                              o.geometry?.type === 'PlaneGeometry' && o.material?.isShaderMaterial,
                          )
                        ? 'post'
                        : renderedCamera.isOrthographicCamera
                          ? 'environment-processing'
                          : 'reflection';
                  const q = focus === 'render' ? begin(label) : null;
                  try {
                    return render.call(this, renderedScene, renderedCamera);
                  } finally {
                    end(q);
                  }
                };
                renderer.shadowMap.render = function (...args) {
                  const q = focus === 'shadow' && args[1] === scene ? begin('shadow') : null;
                  try {
                    return shadow.apply(this, args);
                  } finally {
                    end(q);
                  }
                };
                restores.push(() => {
                  renderer.render = render;
                  renderer.shadowMap.render = shadow;
                });
              }
              if (probe)
                for (const [name, port] of Object.entries(ports))
                  for (const key of Object.keys(port))
                    if (typeof port[key] === 'function' && !Object.isFrozen(port)) {
                      const original = port[key];
                      port[key] = function (...args) {
                        const start = performance.now();
                        try {
                          return original.apply(this, args);
                        } finally {
                          timings[name + '.' + key] =
                            (timings[name + '.' + key] || 0) + performance.now() - start;
                        }
                      };
                      restores.push(() => {
                        port[key] = original;
                      });
                    }
              const people = [];
              scene.traverse((o) => {
                if (o.userData.limbs) people.push(o);
              });
              const peopleStart = people.map((o) => [o.position.x, o.position.z]);
              const trafficStart = window.__traffic.traffic.map((o) => o.pos);
              let previous,
                point = 0,
                distance = 0,
                last = [player.x, player.z],
                maxHeading = player.heading,
                minHeading = player.heading;
              for (let i = 0; i < 600; i++) {
                await new Promise((r) => requestAnimationFrame(r));
                const start = performance.now();
                const interval = previous === undefined ? null : start - previous;
                previous = start;
                let goal = route.points[point];
                const remaining = Math.hypot(goal[0] - player.x, goal[1] - player.z);
                if (remaining < 3.5 && point < route.points.length - 1)
                  goal = route.points[++point];
                const desired = Math.atan2(goal[0] - player.x, -(goal[1] - player.z));
                const error = Math.atan2(
                  Math.sin(desired - player.heading),
                  Math.cos(desired - player.heading),
                );
                const targetSpeed = remaining < 9 || Math.abs(error) > 0.3 ? 6 : 9;
                keys.up = player.speed < targetSpeed - 0.2;
                keys.down = player.speed > targetSpeed + 0.2;
                keys.left = error < -0.025;
                keys.right = error > 0.025;
                keys.handbrake = false;
                renderer.domElement.dispatchEvent(
                  new PointerEvent('pointermove', {
                    pointerId: window.__pointerId,
                    clientX: 470 + 170 * Math.sin(i / 105),
                    clientY: 450 + 25 * Math.sin(i / 140),
                    bubbles: true,
                  }),
                );
                collect();
                focus =
                  i % 4 === 0
                    ? passes
                      ? ['total', 'render', 'shadow'][Math.floor(i / 4) % 3]
                      : 'total'
                    : 'none';
                const q = focus === 'total' ? begin('total') : null;
                const direct = renderer.renderBufferDirect;
                if (probe && [180, 300, 450].includes(i))
                  renderer.renderBufferDirect = function (
                    cam,
                    sc,
                    geometry,
                    material,
                    object,
                    group,
                  ) {
                    let ancestor = object;
                    while (ancestor && !ancestor.userData.wheels) ancestor = ancestor.parent;
                    const spoke =
                      ancestor &&
                      ancestor.userData.wheels.some((w) => w.rolling === object.parent) &&
                      geometry === window.__world.unitBox;
                    const category = geometry.attributes.signalModelView
                      ? 'signal-housing'
                      : spoke
                        ? 'wheel-spoke'
                        : ancestor
                          ? 'other-vehicle'
                          : object.parent?.children.filter(
                                (o) =>
                                  o.geometry?.type === 'CircleGeometry' &&
                                  o.geometry.parameters.radius === 0.22,
                              ).length === 3
                            ? 'traffic-signal'
                            : object.isInstancedMesh
                              ? 'instanced-world'
                              : 'other-world';
                    const pass =
                      material.isMeshDepthMaterial || material.isMeshDistanceMaterial
                        ? 'shadow'
                        : sc === scene
                          ? 'main'
                          : cam.isOrthographicCamera
                            ? 'post-or-environment'
                            : 'reflection';
                    const key = pass + ':' + category;
                    census[key] = (census[key] || 0) + 1;
                    const detail = pass + ':' + category + ':' + geometry.type;
                    const entry = (censusDetails[detail] ||= {
                      requests: 0,
                      calls: 0,
                      triangles: 0,
                      wallMs: 0,
                    });
                    const calls = renderer.info.render.calls,
                      triangles = renderer.info.render.triangles,
                      start = performance.now();
                    entry.requests++;
                    const result = direct.call(this, cam, sc, geometry, material, object, group);
                    entry.wallMs += performance.now() - start;
                    entry.calls += renderer.info.render.calls - calls;
                    entry.triangles += renderer.info.render.triangles - triangles;
                    if (pass === 'main' && category === 'other-world') {
                      const name =
                        Object.keys(window.__world).find((k) => window.__world[k] === material) ||
                        material.type + ':' + material.color?.getHex().toString(16);
                      const materialKey = name + ':' + geometry.type + ':' + material.uuid;
                      const m = (materialCensus[materialKey] ||= {
                        calls: 0,
                        triangles: 0,
                        wallMs: 0,
                        castShadow: object.castShadow,
                        receiveShadow: object.receiveShadow,
                        transparent: material.transparent,
                        maps: ['map', 'normalMap', 'roughnessMap'].filter((k) => material[k]),
                      });
                      m.calls += renderer.info.render.calls - calls;
                      m.triangles += renderer.info.render.triangles - triangles;
                      m.wallMs += performance.now() - start;
                    }
                    return result;
                  };
                const stepStart = performance.now();
                window.__game.step(1 / 60);
                const stepMs = performance.now() - stepStart;
                renderer.renderBufferDirect = direct;
                end(q);
                frames.push({
                  interval,
                  timestamp: performance.timeOrigin + start,
                  stepMs,
                  calls: renderer.info.render.calls,
                  triangles: renderer.info.render.triangles,
                });
                if (visualSamples && [179, 299, 449].includes(i))
                  visual.push({ frame: i + 1, png: renderer.domElement.toDataURL() });
                distance += Math.hypot(player.x - last[0], player.z - last[1]);
                last = [player.x, player.z];
                maxHeading = Math.max(maxHeading, player.heading);
                minHeading = Math.min(minHeading, player.heading);
                trace.push({
                  player: { ...player },
                  camera: [...camera.position.toArray(), ...camera.quaternion.toArray()],
                  traffic: window.__traffic.traffic.map((t) => [t.pos, t.speed, t.braking]),
                  people: people.map((o) => [o.position.x, o.position.z, o.rotation.y]),
                  mode: window.__state.mode,
                  mission: [
                    window.__state.missionIndex,
                    window.__state.stage,
                    window.__state.deliveries,
                    window.__state.credits,
                  ],
                });
              }
              for (const restore of restores) restore();
              // Capture terminal frame in the same task, after timing the full step.
              const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
              gl.readPixels(
                0,
                0,
                gl.drawingBufferWidth,
                gl.drawingBufferHeight,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                pixels,
              );
              const png = renderer.domElement.toDataURL();
              for (let i = 0; pending.length && i < 30; i++) {
                await new Promise((r) => requestAnimationFrame(r));
                collect();
              }
              for (const q of pending) gl.deleteQuery(q);
              const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
              const intervals = frames.slice(1).map((f) => f.interval),
                sorted = intervals.slice().sort((a, b) => a - b);
              const debug = gl.getExtension('WEBGL_debug_renderer_info');
              const movedTraffic = window.__traffic.traffic.filter(
                (t, i) => t.pos !== trafficStart[i],
              ).length;
              const movedPeople = people.filter(
                (o, i) => o.position.x !== peopleStart[i][0] || o.position.z !== peopleStart[i][1],
              ).length;
              window.__driveCapture = { pixels: Array.from(pixels), png, trace, frames, visual };
              return {
                renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
                timings,
                census,
                censusDetails,
                materialCensus,
                passGpu: Object.fromEntries(
                  Object.entries(passGpu).map(([key, values]) => [
                    key,
                    {
                      samples: disjoint ? 0 : values.length,
                      meanMs: disjoint ? null : mean(values),
                    },
                  ]),
                ),
                routeProof: {
                  distance,
                  point,
                  headingRange: maxHeading - minHeading,
                  movedTraffic,
                  movedPeople,
                  elapsedFrames: 600,
                },
                metrics: {
                  fps: 1000 / mean(intervals),
                  frameMs: mean(intervals),
                  p95Ms: sorted[Math.floor(sorted.length * 0.95)],
                  p99Ms: sorted[Math.floor(sorted.length * 0.99)],
                  maxMs: sorted.at(-1),
                  over50Ms: intervals.filter((x) => x > 50).length,
                  over100Ms: intervals.filter((x) => x > 100).length,
                  stepMs: mean(frames.map((f) => f.stepMs)),
                  calls: mean(frames.map((f) => f.calls)),
                  triangles: mean(frames.map((f) => f.triangles)),
                  gpuMs: !disjoint && gpu.length ? mean(gpu) : null,
                  gpuSamples: disjoint ? 0 : gpu.length,
                  resources: { ...renderer.info.memory },
                  heapBytes: performance.memory?.usedJSHeapSize ?? null,
                },
                buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
                programCount: renderer.info.programs.length,
                signalHousingBatched: scene.children.some((o) =>
                  Boolean(o.geometry?.attributes?.signalModelView),
                ),
                maxAttributes: renderer.capabilities.maxAttributes,
                programsValid: renderer.info.programs.every(
                  (p) => p.diagnostics?.runnable !== false,
                ),
              };
            },
            { route, probe, visualSamples, passes },
          )
          .finally(() => clearInterval(telemetryTimer));
        clearInterval(telemetryTimer);
        await sampleGPU();
        result.telemetry = telemetry;
        result.signalMode = result.signalHousingBatched ? mode || 'precise' : 'original';
        const afterPerformance = await cdp.send('Performance.getMetrics');
        const metricMap = (p) => Object.fromEntries(p.metrics.map((m) => [m.name, m.value]));
        const a = metricMap(beforePerformance),
          b = metricMap(afterPerformance);
        result.metrics.mainThreadBusy =
          (b.TaskDuration - a.TaskDuration) / (b.Timestamp - a.Timestamp);
        result.metrics.scriptSeconds = b.ScriptDuration - a.ScriptDuration;
        if (probe && !process.argv.includes('--census')) {
          const { profile } = await cdp.send('Profiler.stop');
          fs.writeFileSync(path.join(output, route.name + '-cpu.json'), JSON.stringify(profile));
        }
        Object.assign(
          result,
          await page.evaluate(() => {
            const capture = window.__driveCapture;
            delete window.__driveCapture;
            return capture;
          }),
        );
        await cdp.send('HeapProfiler.collectGarbage');
        result.metrics.retainedHeapBytes = await page.evaluate(
          () => performance.memory?.usedJSHeapSize ?? null,
        );
        await cdp.detach();
        await page.mouse.up();
        assert.deepEqual(errors, []);
        assert.ok(result.programsValid);
        const prefix = `${route.name}-${round}-${after ? 'after' : 'before'}${probe ? '-probe' : verify ? '-verify' : ''}`;
        fs.writeFileSync(
          path.join(output, prefix + '.png'),
          Buffer.from(result.png.split(',')[1], 'base64'),
        );
        fs.writeFileSync(path.join(output, prefix + '-trace.json'), JSON.stringify(result.trace));
        fs.writeFileSync(path.join(output, prefix + '-frames.json'), JSON.stringify(result.frames));
        result.pixelHash = hash(Buffer.from(result.pixels));
        result.traceHash = hash(JSON.stringify(result.trace));
        result.visualHashes = {};
        for (const shot of result.visual) {
          const bytes = Buffer.from(shot.png.split(',')[1], 'base64');
          fs.writeFileSync(path.join(output, prefix + '-frame-' + shot.frame + '.png'), bytes);
          const { PNG } = require(
            path.join(root, 'node_modules/playwright-core/lib/utilsBundle.js'),
          );
          result.visualHashes[shot.frame] = hash(PNG.sync.read(bytes).data);
        }
        delete result.visual;
        delete result.png;
        delete result.pixels;
        delete result.trace;
        delete result.frames;
        results.push({
          route: route.name,
          round,
          after,
          probe,
          dt: 1 / 60,
          quality: 'high',
          ...result,
        });
        console.log(
          JSON.stringify({
            route: route.name,
            round,
            after,
            metrics: result.metrics,
            proof: result.routeProof,
          }),
        );
        fs.writeFileSync(
          path.join(
            output,
            probe ? 'probe.json' : verify ? 'verification.json' : 'comparison.json',
          ),
          JSON.stringify(results, null, 2),
        );
        if (probe)
          fs.writeFileSync(
            path.join(output, 'probe-' + route.name + '.json'),
            JSON.stringify(results.at(-1), null, 2),
          );
        assert.ok(
          result.routeProof.distance > 35,
          'Route must contain real driving, not a stationary scene.',
        );
        assert.ok(result.routeProof.headingRange > 0.5, 'Car must turn.');
        assert.ok(
          result.routeProof.movedTraffic > 0 && result.routeProof.movedPeople > 0,
          'Traffic and pedestrians must advance.',
        );
        await page.close();
      }
    }
    if (!probe)
      for (const row of results) {
        const references = verify
          ? JSON.parse(
              fs.readFileSync(path.join(archive, 'rejected-signal-housing-comparison.json')),
            )
          : results;
        const base = references.find((r) => !r.after && r.route === row.route);
        assert.equal(row.renderer, base.renderer);
        assert.equal(
          row.traceHash,
          base.traceHash,
          'Player, traffic, pedestrians, camera and mission traces must match.',
        );
        if (!diagnose)
          assert.equal(row.pixelHash, base.pixelHash, 'Terminal framebuffer must match.');
        if (!diagnose && visualSamples)
          assert.deepEqual(
            row.visualHashes,
            base.visualHashes,
            'Checkpoint framebuffers must match.',
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
