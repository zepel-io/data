'use strict';

const fs = require('fs');
const path = require('path');
const Library = require('./src/library');
const parseModules = require('./src/parse-modules');
const getBuiltDist = require('./src/get-built-dist');

let BASE_DATA_FILE = process.argv[2] || false;
let NEW_VENDOR_FILE = process.argv[3] || false;

if (!BASE_DATA_FILE) {
  BASE_DATA_FILE = path.resolve(__dirname, './current-data.json');
}

const data = fs.readFileSync(BASE_DATA_FILE, 'utf-8');
const current_library = Library.fromData(JSON.parse(data));

const builtAsset = getBuiltDist(NEW_VENDOR_FILE);
const new_library = parseModules(builtAsset);

function getDiff(oldLibrary, newLibrary) {
  const diff = {
    name: oldLibrary.name,
    currentSize: oldLibrary.gzipSize,
    newSize: newLibrary.gzipSize,
    packages: {},
  };
  oldLibrary.packages.forEach(pkg => {
    diff.packages[pkg.name] = {
      name: pkg.name,
      currentSize: pkg.gzipSize,
      newSize: 0,
      modules: {},
    };
    let modules = diff.packages[pkg.name].modules;
    pkg.modules.forEach(m => {
      modules[m.name] = {
        name: m.name,
        currentSize: m.gzipSize,
        newSize: 0,
      };
    });
  });
  newLibrary.packages.forEach(pkg => {
    diff.packages[pkg.name] = diff.packages[pkg.name] || {
      name: pkg.name,
      currentSize: 0,
      newSize: pkg.gzipSize,
      modules: {},
    };
    diff.packages[pkg.name].newSize = pkg.gzipSize;
    let modules = diff.packages[pkg.name].modules;
    pkg.modules.forEach(m => {
      modules[m.name] = modules[m.name] || {
        name: m.name,
        currentSize: 0,
        newSize: m.gzipSize,
      };
      modules[m.name].newSize = m.gzipSize;
    });
  });
  diff.packages = Object.values(diff.packages);
  diff.packages.forEach(pkg => {
    pkg.modules = Object.values(pkg.modules);
  });

  return diff;
}

const diff = getDiff(current_library, new_library);

console.log(JSON.stringify(diff, null, 2));
