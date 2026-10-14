const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const builder = fs.readFileSync(path.join(__dirname, '../tools/build-typescript.cjs'), 'utf8');
const content = 'globalThis.fixture = 1;\n';

// Real isolated files; only compiler/linter work is stubbed. No project artifacts or tsc runs.
function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tbs-build-cleanup-test-'));
  const control = { ...options };
  const created = [],
    removed = [],
    writes = [],
    compilers = [],
    errors = [],
    watchers = [],
    timers = [];
  t.after(() => {
    watchers.forEach((watcher) => watcher.close());
    timers.forEach(clearTimeout);
    fs.rmSync(root, { recursive: true, force: true });
  });
  for (const directory of ['src', 'types', 'dist', 'artifacts/typescript-build-old']) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
  }
  const source = path.join(root, 'src/fixture.ts');
  const target = path.join(root, 'dist/fixture.js');
  const sentinel = path.join(root, 'artifacts/typescript-build-old/control.txt');
  fs.writeFileSync(source, content);
  fs.writeFileSync(target, options.outdated ? 'old output\n' : content);
  fs.writeFileSync(sentinel, 'preserve old diagnostics');
  for (const name of ['tsconfig.contracts.json', 'tsconfig.build.json']) {
    fs.writeFileSync(path.join(root, name), '{}');
  }
  const dependencies = {
    'node:path': path,
    'node:fs': {
      ...fs,
      mkdtempSync(prefix) {
        const directory = fs.mkdtempSync(prefix);
        created.push(directory);
        return directory;
      },
      rmSync(directory, args) {
        removed.push(directory);
        assert.ok(created.includes(directory), 'cleanup must only target a directory it created');
        if (control.cleanupError) throw control.cleanupError;
        fs.rmSync(directory, args);
      },
      writeFileSync(file, ...args) {
        writes.push(file);
        fs.writeFileSync(file, ...args);
      },
      watch(file, ...args) {
        const callback = args.at(-1);
        const watcher = control.realWatch ? fs.watch(file, ...args) : { close() {} };
        watchers.push(watcher);
        control.schedule = callback;
        return watcher;
      },
    },
    'node:child_process': {
      spawnSync(_command, args) {
        compilers.push(Array.from(args));
        const index = args.indexOf('--outDir');
        if (index < 0) return { status: control.strictError ? 1 : 0 };
        if (control.emitError) return { error: control.emitError };
        fs.writeFileSync(path.join(args[index + 1], 'fixture.js'), fs.readFileSync(source));
        return { status: 0 };
      },
    },
    eslint: {
      Linter: class {
        verify(_source, config) {
          assert.equal(config.languageOptions.sourceType, 'script');
          return control.invalidScript ? [{ message: 'invalid fixture script' }] : [];
        }
      },
    },
  };
  const localRequire = (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  localRequire.resolve = () => path.join(root, 'node_modules/typescript/package.json');
  const processState = {
    argv: ['node', 'builder', ...(options.mode ? [options.mode] : [])],
    execPath: process.execPath,
  };
  const context = vm.createContext({
    require: localRequire,
    __dirname: path.join(root, 'tools'),
    process: processState,
    console: {
      log(message) {
        if (/^Built /.test(message)) control.onBuilt?.();
      },
      error: (message) => errors.push(message),
    },
    setTimeout(callback, delay) {
      const timer = setTimeout(callback, delay);
      timers.push(timer);
      return timer;
    },
    clearTimeout,
  });
  vm.runInContext(builder, context, { filename: 'build-typescript.cjs' });
  function preserved() {
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'preserve old diagnostics');
    assert.deepEqual(removed, created);
  }
  return {
    context,
    control,
    processState,
    created,
    removed,
    writes,
    compilers,
    errors,
    source,
    target,
    preserved,
  };
}

test('successful and repeated builds remove only their own temporary directories', (t) => {
  const f = fixture(t);
  vm.runInContext('attempt()', f.context);
  assert.equal(f.processState.exitCode, 0);
  assert.equal(f.created.length, 2);
  assert.equal(new Set(f.created).size, 2);
  assert.equal(f.compilers.length, 4, 'two compiler invocations per successful build');
  assert.ok(f.created.every((directory) => !fs.existsSync(directory)));
  assert.equal(fs.readFileSync(f.target, 'utf8'), content);
  f.preserved();
});

test('failed emission and classic-script validation preserve errors and clean their directories', (t) => {
  for (const options of [{ emitError: new Error('emission failed') }, { invalidScript: true }]) {
    const f = fixture(t, { ...options, outdated: true });
    assert.equal(f.processState.exitCode, 1);
    assert.match(f.errors.at(-1), /emission failed|not a standalone classic script/);
    assert.ok(f.created.every((directory) => !fs.existsSync(directory)));
    assert.equal(fs.readFileSync(f.target, 'utf8'), 'old output\n');
    f.preserved();
  }
});

test('cleanup failure is reported separately and does not replace the original thrown error', (t) => {
  const original = new Error('original compiler error');
  const f = fixture(t, { emitError: original, cleanupError: new Error('cleanup denied') });
  assert.equal(f.processState.exitCode, 1);
  assert.match(f.errors[0], /Temporary build cleanup failed.*cleanup denied/);
  assert.equal(f.errors[1], original.message);
  assert.throws(
    () => vm.runInContext('build()', f.context),
    (error) => error === original,
  );
  f.preserved();
});

test('cleanup failure alone makes the operation fail; strict failure needs no temporary directory', (t) => {
  const f = fixture(t, { cleanupError: new Error('cleanup denied') });
  assert.equal(f.processState.exitCode, 1);
  assert.match(f.errors[0], /Temporary build cleanup failed.*cleanup denied/);
  f.preserved();
  const strict = fixture(t, { strictError: true });
  assert.equal(strict.processState.exitCode, 1);
  assert.equal(strict.compilers.length, 1);
  assert.equal(strict.created.length, 0);
  strict.preserved();
});

test('build:check cleans up on match and mismatch without writing dist', (t) => {
  for (const outdated of [false, true]) {
    const f = fixture(t, { mode: '--check', outdated });
    assert.equal(f.processState.exitCode, outdated ? 1 : 0);
    assert.equal(f.writes.length, 0, 'check must perform no output writes');
    assert.equal(fs.readFileSync(f.target, 'utf8'), outdated ? 'old output\n' : content);
    assert.ok(f.created.every((directory) => !fs.existsSync(directory)));
    if (outdated) assert.match(f.errors[0], /missing or outdated/);
    f.preserved();
  }
});

test('watch recovers from a handled error and cleans every attempt', (t) => {
  const f = fixture(t, { mode: '--watch' });
  f.control.emitError = new Error('temporary compiler error');
  vm.runInContext('attempt()', f.context);
  assert.equal(f.processState.exitCode, 1);
  f.control.emitError = undefined;
  vm.runInContext('attempt()', f.context);
  assert.equal(f.processState.exitCode, 0);
  assert.equal(f.created.length, 3);
  assert.ok(f.created.every((directory) => !fs.existsSync(directory)));
  f.preserved();
});

test('isolated watch observes one source change and rebuilds with actual filesystem watchers', async (t) => {
  const f = fixture(t, { mode: '--watch', realWatch: true });
  assert.equal(f.created.length, 1);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('isolated watch rebuild timed out')), 5000);
    f.control.onBuilt = () => {
      clearTimeout(timeout);
      resolve();
    };
    fs.writeFileSync(f.source, 'globalThis.fixture = 2;\n');
  });
  assert.equal(f.processState.exitCode, 0);
  assert.equal(f.created.length, 2);
  assert.equal(f.compilers.length, 4);
  assert.equal(fs.readFileSync(f.target, 'utf8'), 'globalThis.fixture = 2;\n');
  assert.ok(f.created.every((directory) => !fs.existsSync(directory)));
  f.preserved();
});
