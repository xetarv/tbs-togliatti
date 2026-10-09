const test = require('node:test');
const assert = require('node:assert/strict');
const { ESLint } = require('eslint');
const { loadModules } = require('./helpers.cjs');

test('the domain and application load without browser globals or a 3D engine', () => {
  const { TBS, context } = loadModules(
    [
      'domain/config.js',
      'domain/state.js',
      'domain/math.js',
      'domain/collision.js',
      'domain/road-network.js',
      'domain/player-physics.js',
      'domain/traffic.js',
      'domain/missions.js',
      'application/game.js',
      'application/session.js',
      'application/mission-controller.js',
    ],
    {},
    { browser: false },
  );
  assert.equal('window' in context, false);
  assert.equal('document' in context, false);
  assert.equal('THREE' in context, false);
  const state = TBS.createState();
  const traffic = TBS.createTrafficSimulation({ ...TBS.config, player: state.player });
  traffic.advanceTraffic(0.05);
  assert.equal(traffic.traffic.length, 36);
  const mission = TBS.config.missions[0];
  assert.equal(Reflect.set(mission, 'reward', 0), false);
  assert.equal(Reflect.set(mission.from, 'x', 0), false);
  assert.equal(mission.reward, 1200);
});

test('ESLint rejects browser and adapter dependencies inside the game layers', async () => {
  const eslint = new ESLint();
  for (const layer of ['domain', 'application']) {
    const [result] = await eslint.lintText(
      "document.createElement('canvas'); globalThis.TBS.createGraphics({});",
      { filePath: `src/${layer}/boundary-example.js` },
    );
    const rules = result.messages.map((message) => message.ruleId);
    assert.ok(rules.includes('no-undef'));
    assert.ok(rules.includes('no-restricted-syntax'));
  }
});
