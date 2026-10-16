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
  const { TBS } = loadModules(['dist/adapters/browser/runtime.js']);
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

test('fatal runtime failures stop scheduling and allow an explicit restart', () => {
  for (const phase of ['initialize', 'step', 'hidden', 'initial-request', 'frame-request']) {
    let callback;
    let requests = 0;
    let initialized = 0;
    let steps = 0;
    let failed = true;
    const failure = new Error(phase);
    const { TBS } = loadModules(['dist/adapters/browser/runtime.js']);
    const runtime = TBS.createRuntime({
      game: {
        initialize() {
          initialized++;
          if (failed && phase === 'initialize') throw failure;
        },
        step() {
          steps++;
          if (failed && phase === 'step') throw failure;
        },
      },
      scheduler: {
        request(fn) {
          if (
            failed &&
            ((phase === 'initial-request' && requests === 0) ||
              (phase === 'frame-request' && requests > 0))
          )
            throw failure;
          callback = fn;
          return ++requests;
        },
        cancel() {},
      },
      clock: { now: () => 0 },
      isHidden() {
        if (failed && phase === 'hidden') throw failure;
        return false;
      },
    });
    if (phase === 'initialize' || phase === 'initial-request') {
      assert.throws(
        () => runtime.start(),
        (error) => error === failure,
      );
    } else {
      runtime.start();
      assert.throws(
        () => callback(16),
        (error) => error === failure,
      );
      const count = steps;
      callback(32);
      assert.equal(steps, count, 'The stopped callback cannot step again');
    }
    const previousRequests = requests;
    failed = false;
    runtime.start();
    assert.equal(requests, previousRequests + 1, phase);
    assert.equal(initialized, 2, phase);
    runtime.start();
    assert.equal(requests, previousRequests + 1, 'No duplicate live loop');
    callback(48);
    assert.equal(requests, previousRequests + 2);
    runtime.stop();
  }
});
