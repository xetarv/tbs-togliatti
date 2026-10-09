const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModules(files, globals = {}, { browser = true } = {}) {
  const context = vm.createContext({ console, ...globals });
  if (browser) context.window = context;
  for (const file of ['bootstrap/namespace.js', ...files]) {
    const filename = path.join(__dirname, '..', 'src', file);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  }
  return { TBS: { ...context.TBS, ...context.TBS.domain, ...context.TBS.application }, context };
}

module.exports = { loadModules };
