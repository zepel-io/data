const Library = require('./library');

const moduleNames = ['ember-cli-pemberly-m3'];

module.exports = function parseModules(builtAsset) {
  let modules = builtAsset
    .split('define(')
    .join('MODULE_SPLIT_POINTdefine(')
    .split('MODULE_SPLIT_POINT');

  modules = modules.filter(mod => {
    for (let i = 0; i < moduleNames.length; i++) {
      let projectName = moduleNames[i];
      if (mod.indexOf(projectName) > -1) {
        return true;
      }
    }
    return false;
  });

  let library = new Library('EmberData');

  modules.forEach(m => {
    let end = m.indexOf(',', 8) - 1;
    let name = m.substring(8, end);

    let packageName = 'ember-cli-pemberly-m3';

    library.getPackage(packageName).addModule(name, m);
  });

  library.sort();
  return library;
};
