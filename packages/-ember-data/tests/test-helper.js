import RSVP from 'rsvp';
import { start } from 'ember-qunit';
import QUnit from 'qunit';
import { wait } from 'dummy/tests/helpers/async';
import { configure } from 'dummy/tests/helpers/assert-deprecations';

const { assert } = QUnit;

configure();

QUnit.begin(() => {
  function assertAllDeprecations(assert) {
    if (typeof assert.test.expected === 'number') {
      assert.test.expected += 1;
    }
    assert.expectNoDeprecation();
  }
  // ensure we don't regress quietly
  // this plays nicely with `expectDeprecation`
  QUnit.config.modules.forEach(mod => {
    const hooks = (mod.hooks.afterEach = mod.hooks.afterEach || []);
    // prevent nested modules from asserting multiple times
    if (mod.parentModule === null) {
      hooks.push(assertAllDeprecations);
    }
  });

  RSVP.configure('onerror', reason => {
    // only print error messages if they're exceptions;
    // otherwise, let a future turn of the event loop
    // handle the error.
    // TODO kill this off
    if (reason && reason instanceof Error) {
      throw reason;
    }
  });
});

// TODO kill these off
assert.wait = wait;
assert.assertClean = function(promise) {
  return promise.then(
    this.wait(record => {
      this.equal(record.get('hasDirtyAttributes'), false, 'The record is now clean');
      return record;
    })
  );
};

// TODO kill this off
assert.contains = function(array, item) {
  this.ok(array.indexOf(item) !== -1, `array contains ${item}`);
};

// TODO kill this off
assert.without = function(array, item) {
  this.ok(array.indexOf(item) === -1, `array doesn't contain ${item}`);
};

QUnit.config.testTimeout = 2000;
QUnit.config.urlConfig.push({
  id: 'enableoptionalfeatures',
  label: 'Enable Opt Features',
});
start({ setupTestIsolationValidation: true });
