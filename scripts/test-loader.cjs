const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, mocks = {}, cache = new Map()) {
  const name = ['', '.ts', '.tsx'].map(ext => path.resolve(file + ext)).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
  if (!name) throw new Error('Missing module: ' + file);
  if (name === path.resolve('src/lib/prisma/db.ts') && mocks['@/lib/prisma/db']) return mocks['@/lib/prisma/db'];
  if (cache.has(name)) return cache.get(name).exports;
  const module = { exports: {} }; cache.set(name, module);
  const source = ts.transpileModule(fs.readFileSync(name, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', source)(id => {
    if (id in mocks) return mocks[id];
    if (id === 'server-only') return {};
    if (id.startsWith('@/')) return load('src/' + id.slice(2), mocks, cache);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(name), id), mocks, cache);
    return require(id);
  }, module, module.exports);
  return module.exports;
}
module.exports = { load };
