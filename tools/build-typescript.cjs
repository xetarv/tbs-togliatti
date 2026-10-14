const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Linter } = require('eslint');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'src');
const outputDir = path.join(root, 'dist');
const compiler = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
const mode = process.argv[2];
if (process.argv.length > 3 || (mode && !['--check', '--watch'].includes(mode))) {
  throw new Error('Usage: node tools/build-typescript.cjs [--check|--watch]');
}

function runCompiler(args) {
  const result = spawnSync(process.execPath, [compiler, ...args], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('TypeScript failed; dist was not updated.');
}

function build() {
  const sources = fs
    .readdirSync(sourceDir, { recursive: true })
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'))
    .sort();
  for (const file of sources) {
    if (fs.existsSync(path.join(sourceDir, file.replace(/\.ts$/, '.js')))) {
      throw new Error(`Conflicting .ts and .js sources: ${file}`);
    }
  }

  console.log('Strict typecheck: existing JSDoc modules and TypeScript sources.');
  runCompiler(['--project', 'tsconfig.contracts.json']);
  // Types from the JSDoc modules are checked above. Emit only TS, never copies of JS.
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  const temporaryDir = fs.mkdtempSync(path.join(root, 'artifacts', 'typescript-build-'));
  let failed = false;
  let cleanupFailure;
  try {
    runCompiler(['--project', 'tsconfig.build.json', '--outDir', temporaryDir]);

    const linter = new Linter();
    const outputs = sources.map((file) => {
      const name = file.replace(/\.ts$/, '.js');
      const content = fs.readFileSync(path.join(temporaryDir, name), 'utf8');
      const errors = linter.verify(content, {
        languageOptions: { ecmaVersion: 'latest', sourceType: 'script' },
        rules: {
          'no-restricted-syntax': [
            'error',
            'ImportExpression',
            "CallExpression[callee.name='require']",
            "MemberExpression[object.name='module'][property.name='exports']",
            "MemberExpression[object.name='exports']",
          ],
        },
      });
      if (errors.length) {
        throw new Error(`${name} is not a standalone classic script: ${errors[0].message}`);
      }
      return { name, content };
    });

    const expected = new Set(outputs.map(({ name }) => name));
    if (fs.existsSync(outputDir)) {
      for (const file of fs.readdirSync(outputDir, { recursive: true })) {
        if (file.endsWith('.js') && !expected.has(file)) {
          throw new Error(
            `Unexpected dist file: ${file}. Resolve manually; no files were deleted.`,
          );
        }
      }
    }
    if (mode === '--check') {
      for (const { name, content } of outputs) {
        const target = path.join(outputDir, name);
        if (
          !fs.existsSync(target) ||
          fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content
        ) {
          throw new Error(
            `${name} is missing or outdated. Run npm run build and include dist in Git.`,
          );
        }
      }
    } else {
      for (const { name, content } of outputs) {
        const target = path.join(outputDir, name);
        if (
          !fs.existsSync(target) ||
          fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content
        ) {
          console.log(`Updating missing or outdated dist/${name.split(path.sep).join('/')}.`);
        }
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      }
    }
    console.log(
      `${mode === '--check' ? 'Verified' : 'Built'} ${outputs.length} classic script(s).`,
    );
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    try {
      fs.rmSync(temporaryDir, { recursive: true, force: true });
    } catch (error) {
      const message = `Temporary build cleanup failed (${temporaryDir}): ${error.message}`;
      cleanupFailure = new Error(message, { cause: error });
      if (failed) console.error(message);
    }
  }
  if (cleanupFailure) throw cleanupFailure;
}

function attempt() {
  try {
    build();
    process.exitCode = 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

attempt();
if (mode === '--watch') {
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(attempt, 150);
  };
  for (const directory of ['src', 'types']) {
    fs.watch(path.join(root, directory), { recursive: true }, schedule);
  }
  for (const config of ['tsconfig.contracts.json', 'tsconfig.build.json']) {
    fs.watch(path.join(root, config), schedule);
  }
  console.log('Watching src, types and TypeScript configuration. Ctrl+C to stop.');
}
