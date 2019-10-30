'use strict';

const fs = require('fs');
const path = require('path');
const Library = require('./src/library');
const parseModules = require('./src/parse-modules');
const getBuiltDist = require('./src/get-built-dist');
const chalk = require('chalk');

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

function analyzeDiff(diff) {
  let failures = [];
  return failures;
}

function printDiff(diff) {
  printItem(diff);
  diff.packages.forEach(pkg => {
    printItem(pkg, 2);
    pkg.modules.forEach(m => {
      printItem(m, 4);
    });
  });
}

function printItem(item, indent = 0) {
  const indentColor = indent >= 4 ? 'grey' : indent >= 2 ? 'yellow' : indent >= 0 ? 'magenta' : 'green';
  console.log(
    leftPad(
      chalk[indentColor](item.name) + ' ' + chalk.white(formatBytes(item.newSize)) + formatDelta(item),
      indent * 2
    )
  );
}

function formatDelta(item) {
  if (item.currentSize === item.newSize) {
    return;
  }
  if (item.currentSize > item.newSize) {
    return chalk.green(` (- ${formatBytes(item.currentSize - item.newSize)})`);
  } else {
    return chalk.red(` (+ ${formatBytes(item.newSize - item.currentSize)})`);
  }
}

function formatBytes(b) {
  let str;
  if (b > 1024) {
    str = (b / 1024).toFixed(2) + ' KB';
  } else {
    str = b + ' B';
  }

  return str;
}

function leftPad(str, len, char = ' ') {
  for (let i = 0; i < len; i++) {
    str = char + str;
  }
  return str;
}

printDiff(diff);
analyzeDiff(diff);
