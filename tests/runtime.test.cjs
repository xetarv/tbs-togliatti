const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModules } = require('./helpers.cjs');

test('the scheduler caps elapsed time, skips hidden tabs, resets and stops cleanly', () => {
  let callback;
  let scheduled = 0;
  let cancelled = 0;
  let now = 0;
  let hidden = false;
  let initialized = 0;
  const steps = [];
  const { TBS } = loadModules(['adapters/browser/runtime.js']);
  const runtime = TBS.createRuntime({
    game: { step: (dt) => steps.push(dt), initialize: () => initialized++ },
    scheduler: {
      request(fn) {
        callback = fn;
        return ++scheduled;
      },
      cancel() {
        cancelled++;
      },
    },
    clock: { now: () => now },
    isHidden: () => hidden,
  });
  runtime.start();
  runtime.start();
  assert.equal(scheduled, 1);
  assert.equal(initialized, 1);
  callback(10000);
  assert.deepEqual(steps, [0.05]);
  hidden = true;
  callback(20000);
  assert.equal(steps.length, 1);
  hidden = false;
  now = 20500;
  runtime.reset();
  callback(20520);
  assert.deepEqual(steps, [0.05, 0.02]);
  runtime.stop();
  const count = scheduled;
  callback(31000);
  assert.equal(scheduled, count);
  assert.equal(cancelled, 1);
});
