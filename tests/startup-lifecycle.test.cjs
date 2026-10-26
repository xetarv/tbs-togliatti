const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { getEventListeners } = require('node:events');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

test('session close removes only its native subscriptions and preserves callback identity', () => {
  const { TBS } = loadModules(['dist/adapters/browser/session-listeners.js'], { AbortController });
  const target = new EventTarget();
  const old = TBS.createSessionListeners(),
    next = TBS.createSessionListeners();
  let oldCalls = 0,
    nextCalls = 0,
    foreignCalls = 0;
  const callback = () => oldCalls++;
  target.addEventListener('ping', () => foreignCalls++);
  old.listen(target, 'ping', callback, { passive: true });
  next.listen(target, 'ping', () => nextCalls++);
  assert.ok(getEventListeners(target, 'ping').includes(callback));
  target.dispatchEvent(new Event('ping'));
  old.close();
  old.close();
  target.dispatchEvent(new Event('ping'));
  assert.deepEqual([oldCalls, nextCalls, foreignCalls], [1, 2, 2]);
  assert.equal(old.snapshot().active, 0);
  assert.equal(next.snapshot().active, 1);
  assert.throws(() => old.listen(target, 'ping', callback), /closed/);
  const fresh = TBS.createSessionListeners();
  assert.throws(
    () => fresh.listen(target, 'ping', callback, { signal: new AbortController().signal }),
    /another signal/,
  );
  next.close();
  assert.equal(getEventListeners(target, 'ping').length, 1);
});

test('terminal world cleanup deduplicates owned resources and captures instances before detachment', () => {
  const { TBS } = loadModules(['dist/adapters/rendering/startup-cleanup.js']);
  const scene = new T.Scene(),
    texture = new T.Texture(),
    borrowed = new T.Texture();
  borrowed.isRenderTargetTexture = true;
  const material = new T.MeshStandardMaterial({ map: texture, envMap: borrowed });
  material.uniforms = { aliases: { value: [texture, texture, borrowed] } };
  const geometry = new T.BoxGeometry();
  const instance = new T.InstancedMesh(geometry, material, 1);
  scene.add(new T.Mesh(geometry, material), new T.Mesh(geometry, material), instance);
  const counts = {
    instance: 0,
    material: 0,
    geometry: 0,
    texture: 0,
    borrowed: 0,
    stop: 0,
    graphics: 0,
    environment: 0,
    shadow: 0,
    renderer: 0,
  };
  for (const [key, owner] of Object.entries({ instance, material, geometry, texture, borrowed }))
    owner.addEventListener('dispose', () => counts[key]++);
  const renderer = {
    __startupPasses: () => [{ scene }],
    __startupDispose() {
      counts.graphics++;
      scene.remove(instance);
    },
    shadowMap: {
      dispose() {
        counts.shadow++;
      },
    },
    dispose() {
      counts.renderer++;
    },
  };
  const world = {
    renderer,
    scene,
    facadeMaterials: [texture],
    startupEnvironmentTarget: {
      dispose() {
        counts.environment++;
      },
    },
  };
  const close = TBS.installStartupEnvironmentCleanup(world, {
    stop() {
      counts.stop++;
    },
  });
  close();
  close();
  assert.deepEqual(counts, {
    instance: 1,
    material: 1,
    geometry: 1,
    texture: 1,
    borrowed: 0,
    stop: 1,
    graphics: 1,
    environment: 1,
    shadow: 1,
    renderer: 1,
  });
  assert.equal(renderer.__startupPasses, undefined);
  assert.equal(renderer.__startupClose, undefined);
});

test('the original vendor and separate Safe retain their exact pinned provenance', () => {
  const hash = (file) =>
    crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(__dirname, '..', file)))
      .digest('hex');
  assert.equal(
    hash('assets/three.min.js'),
    '8a5f7249903b54d30f79f708699d2fed2d6a1d0741a4cd41377d1f01bb5a2271',
  );
  assert.equal(
    hash('assets/three-r149-safe.min.js'),
    '061f51c90a5e594fb344732929a6938ebb5475580f75cfb13347a24b95457fb3',
  );
});
