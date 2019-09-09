import QUnit from 'qunit';
import { registerDeprecationHandler } from '@ember/debug';
import { checkMatcher } from 'ember-qunit-assert-helpers/test-support/-private/utils';

export function configure() {
  let DEPRECATIONS_FOR_TEST;
  let HANDLED_DEPRECATIONS_FOR_TEST;

  QUnit.testStart(function() {
    DEPRECATIONS_FOR_TEST = [];
    HANDLED_DEPRECATIONS_FOR_TEST = [];
  });

  registerDeprecationHandler(function(message, options, next) {
    if (DEPRECATIONS_FOR_TEST) {
      DEPRECATIONS_FOR_TEST.push({ message, options });
    }
    // we do not call next to avoid spamming the console
  });

  function assertDeprecations(qunitAssert, matcher, count = 1) {
    let matchedDeprecations = DEPRECATIONS_FOR_TEST.filter(deprecation => {
      let isMatched = false;
      if (deprecation.options && deprecation.options.id) {
        isMatched = checkMatcher(deprecation.options.id, matcher);
      }
      return isMatched || checkMatcher(deprecation.message, matcher);
    });
    HANDLED_DEPRECATIONS_FOR_TEST.push(...matchedDeprecations);

    let passed = matchedDeprecations.length === count;

    qunitAssert.pushResult({
      result: passed,
      actual: matchedDeprecations,
      expected: null,
      message: `Expected ${count} deprecation${count === 1 ? '' : 's'} during test, ${
        passed ? count : 'but ' + matchedDeprecations.length
      } deprecations were found.`,
    });
  }

  function assertNoDeprecations(qunitAssert) {
    const UNHANDLED_DEPRECATIONS = DEPRECATIONS_FOR_TEST.filter(i => {
      return HANDLED_DEPRECATIONS_FOR_TEST.indexOf(i) === -1;
    });

    let deprecationStr = UNHANDLED_DEPRECATIONS.reduce((a, b) => {
      return `${b}${a.message}\n`;
    }, '');

    let passed = UNHANDLED_DEPRECATIONS.length === 0;

    qunitAssert.pushResult({
      result: passed,
      actual: UNHANDLED_DEPRECATIONS,
      expected: [],
      message: `Expected 0 deprecations during test, ${
        passed ? '0' : 'but ' + UNHANDLED_DEPRECATIONS.length
      } deprecations were found.\n${deprecationStr}`,
    });
  }

  QUnit.assert.expectDeprecation = function(cb, matcher, count) {
    let origDeprecations = DEPRECATIONS_FOR_TEST;

    if (typeof cb !== 'function') {
      count = matcher;
      matcher = cb;
      cb = null;
    }

    if (cb) {
      DEPRECATIONS_FOR_TEST = [];
      cb();
    }

    assertDeprecations(this, matcher, count);
    DEPRECATIONS_FOR_TEST = origDeprecations.concat(DEPRECATIONS_FOR_TEST);
  };

  QUnit.assert.expectNoDeprecation = function(cb) {
    let origDeprecations = DEPRECATIONS_FOR_TEST;

    if (cb) {
      DEPRECATIONS_FOR_TEST = [];
      cb();
    }

    assertNoDeprecations(this);
    DEPRECATIONS_FOR_TEST = origDeprecations.concat(DEPRECATIONS_FOR_TEST);
  };
}
