const test = require('node:test');
const assert = require('node:assert/strict');
const { ESLint } = require('eslint');
const { loadModules } = require('./helpers.cjs');

test('the domain and application load without browser globals or a 3D engine', () => {
  const { TBS, context } = loadModules(
    [
      'dist/domain/config.js',
      'dist/domain/state.js',
      'dist/domain/math.js',
      'dist/domain/collision.js',
      'dist/domain/road-network.js',
      'dist/domain/player-physics.js',
      'dist/domain/traffic.js',
      'dist/domain/missions.js',
      'dist/application/game.js',
      'dist/application/session.js',
      'dist/application/mission-controller.js',
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

async function lintTypeScript(source, filePath) {
  const [result] = await new ESLint().lintText(source, { filePath });
  assert.ok(result, 'The virtual TypeScript file must be linted.');
  assert.equal(result.fatalErrorCount, 0, 'TypeScript must parse successfully.');
  assert.ok(
    !result.messages.some((message) => message.ruleId === null),
    'The virtual file must not be ignored or lack a matching configuration.',
  );
  return result;
}

test('ESLint accepts strict TypeScript annotations and own-layer registry access', async () => {
  for (const layer of ['domain', 'application']) {
    const result = await lintTypeScript(
      `type Position = { x: number }; globalThis.TBS.${layer}.fixture = (value: Position): number => value.x;`,
      `src/${layer}/valid-example.ts`,
    );
    assert.deepEqual(result.messages, []);
  }
});

test('ESLint detects TypeScript unused variables using the TS rule', async () => {
  const result = await lintTypeScript('const unused: number = 1;', 'src/domain/unused-example.ts');
  assert.deepEqual(
    result.messages.map((message) => message.ruleId),
    ['@typescript-eslint/no-unused-vars'],
  );
});

test('ESLint rejects bare and global-object browser dependencies in TypeScript layers', async () => {
  for (const layer of ['domain', 'application']) {
    for (const source of [
      "document.createElement('canvas');",
      "globalThis.document.createElement('canvas');",
      "globalThis['document'].createElement('canvas');",
      'window.alert(1);',
      'THREE.Scene();',
    ]) {
      const result = await lintTypeScript(source, `src/${layer}/browser-example.ts`);
      assert.ok(result.messages.some((message) => message.ruleId === 'no-restricted-globals'));
    }
  }
});

test('ESLint rejects foreign TBS registries and runtime imports in TypeScript layers', async () => {
  for (const layer of ['domain', 'application']) {
    const other = layer === 'domain' ? 'application' : 'domain';
    for (const source of [
      'globalThis.TBS.createGraphics({});',
      `globalThis.TBS.${other}.fixture();`,
      `globalThis['TBS']['${other}'].fixture();`,
      "import '../adapters/ui/dom';",
    ]) {
      const result = await lintTypeScript(source, `src/${layer}/registry-example.ts`);
      assert.ok(result.messages.some((message) => message.ruleId === 'no-restricted-syntax'));
    }
  }
});

test('ESLint accepts ambient declarations, type-only parameters and interface merging', async () => {
  const result = await lintTypeScript(
    `interface FixtureBase { x: number; }
     interface FixtureHandle extends FixtureBase {}
     interface FixtureHandle { move: (value: number) => void; }
     declare var fixture: FixtureHandle;`,
    'types/ambient-example.d.ts',
  );
  assert.deepEqual(result.messages, []);
});

test('Canvas call ternaries are restricted to two files and still require effects', async () => {
  const prefix = 'declare const py: number; declare const c: CanvasRenderingContext2D; ';
  const calls = 'py ? c.lineTo(1, 2) : c.moveTo(1, 2);';
  for (const file of [
    'src/adapters/world/showcase/materials.ts',
    'src/adapters/world/visual-assets.ts',
  ]) {
    assert.deepEqual((await lintTypeScript(prefix + calls, file)).messages, []);
    for (const expression of [
      'py ? 1 : 2;',
      'py ? c.lineTo(1, 2) : 2;',
      'py ? 1 : c.moveTo(1, 2);',
    ]) {
      const result = await lintTypeScript(prefix + expression, file);
      assert.ok(
        result.messages.some((m) => m.ruleId === '@typescript-eslint/no-unused-expressions'),
      );
    }
  }
  for (const file of [
    'src/adapters/world/showcase/roof.ts',
    'src/adapters/rendering/geometry.ts',
    'src/domain/state.ts',
  ]) {
    const result = await lintTypeScript(prefix + calls, file);
    assert.ok(result.messages.some((m) => m.ruleId === '@typescript-eslint/no-unused-expressions'));
  }
});
