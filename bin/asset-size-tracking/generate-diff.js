'use strict';

const fs = require('fs');
const path = require('path');
const Library = require('./src/library');
const parseModules = require('./src/parse-modules');
const getBuiltDist = require('./src/get-built-dist');
const chalk = require('chalk');
const library_failure_threshold = 70;
const package_failure_threshold = 30;

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

  if (diff.currentSize < diff.newSize) {
    let delta = diff.newSize - diff.currentSize;
    if (delta > library_failure_threshold) {
      failures.push(
        `The compressed size of the library ${diff.name} has increased by ${delta} bytes which exceeds the failure threshold of ${library_failure_threshold} bytes.`
      );
    }
  }

  diff.packages.forEach(pkg => {
    if (pkg.currentSize < pkg.newSize) {
      let delta = pkg.newSize - pkg.currentSize;
      if (delta > package_failure_threshold) {
        failures.push(
          `The compressed size of the package ${pkg.name} has increased by ${delta} bytes which exceeds the failure threshold of ${package_failure_threshold} bytes.`
        );
      }
    }
  });

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
  if (item.currentSize !== item.newSize) {
    const indentColor = indent >= 4 ? 'grey' : indent >= 2 ? 'yellow' : indent >= 0 ? 'magenta' : 'green';
    console.log(
      leftPad(
        chalk[indentColor](item.name) + ' ' + chalk.white(formatBytes(item.newSize)) + formatDelta(item),
        indent * 2
      )
    );
  }
}

function formatDelta(item) {
  if (item.currentSize === item.newSize) {
    return '';
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
const failures = analyzeDiff(diff);

if (failures.length) {
  console.log('Failed Checks\n-----------------------');
  failures.forEach(f => {
    console.log(f);
  });
  process.exit(1);
} else {
  process.exit(0);
}
