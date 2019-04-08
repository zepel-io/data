import { get } from '@ember/object';
import { setupTest } from 'ember-qunit';
import Model from 'ember-data/model';
import Store from 'ember-data/store';
import { attr, belongsTo } from '@ember-decorators/data';
import { module, test } from 'qunit';
import { settled } from '@ember/test-helpers';
import RecordData from '../../../addon/-private/ts-interfaces/record-data';

class Book extends Model {
  // TODO fix the typing for naked attrs
  @attr('string', {})
  title;
}

class Person extends Model {
  // TODO fix the typing for naked attrs
  @attr('string', {})
  name;
}

class House extends Model {
  // TODO fix the typing for naked attrs
  @attr('something', {})
  name;

  @belongsTo('person', {}) person;
}

class TestRecordData implements RecordData {
  pushData(data, calculateChange?: boolean) {

  }
  clientDidCreate() {

  }

  willCommit() {

  }

  commitWasRejected() {

  }
  unloadRecord() {

  }
  rollbackAttributes() {

  }
  changedAttributes(): any {

  }

  hasChangedAttributes(): boolean {
    return false;
  }

  setDirtyAttribute(key: string, value: any) {

  }

  getAttr(key: string): string {
    return "test";
  }

  hasAttr(key: string): boolean {
    return false;
  }

  getHasMany(key: string) {
    return {};
  }

  addToHasMany(key: string, recordDatas: this[], idx?: number) {

  }
  removeFromHasMany(key: string, recordDatas: this[]) {

  }
  setDirtyHasMany(key: string, recordDatas: this[]) {

  }

  getBelongsTo(key: string) {
  }

  setDirtyBelongsTo(name: string, recordData: this | null) {

  }

  didCommit(data) {

  }

  isAttrDirty(key: string) { return false; }
  removeFromInverseRelationships(isNew: boolean) { }

  _initRecordCreateOptions(options) { }
}

let CustomStore = Store.extend({
  createRecordDataFor(modelName, id, clientId, storeWrapper) {
    return new TestRecordData();
  }
});

module('integration/record-data - Custom RecordData Implementations', function (hooks) {
  setupTest(hooks);

  let store;

  hooks.beforeEach(function () {
    let { owner } = this;

    owner.register('model:person', Person);
    owner.register('service:store', CustomStore);
  });

  test("A noop Record Data implementation that follows the spec should not error out", async function (assert) {
    let { owner } = this;
    store = owner.lookup('service:store');

    store.push({
      data: [
        {
          type: 'person',
          id: '1',
          attributes: {
            name: 'Scumbag Dale',
          },
        },
        {
          type: 'person',
          id: '2',
          attributes: {
            name: 'Scumbag Katz',
          },
        },
      ],
    });

    let all = store.peekAll('person');
    assert.equal(get(all, 'length'), 2);

    store.push({
      data: [
        {
          type: 'person',
          id: '3',
          attributes: {
            name: 'Scumbag Bryn',
          },
        },
      ],
    });

    await settled();

    assert.equal(get(all, 'length'), 3);
  });

  test("Record Data push and save lifecycle", async function (assert) {
    assert.expect(13);
    let called = 0;
    let createCalled = 0;
    const personHash = {
      type: 'person',
      id: '1',
      attributes: {
        name: 'Scumbag Dale',
      }
    }
    let { owner } = this;
    let calledPush = 0
    let calledClientDidCreate = 0;
    let calledWillCommit = 0;
    let calledWasRejected = 0;
    let calledUnloadRecord = 0;
    let calledRollbackAttributes = 0;
    let calledDidCommit = 0;

    class LifecycleRecordData extends TestRecordData {
      pushData(data, calculateChange?: boolean) {
        calledPush++;
        debugger
      }

      clientDidCreate() {
        calledClientDidCreate++;
      }

      willCommit() {
        calledWillCommit++;
      }

      commitWasRejected() {
        calledWasRejected++;
      }

      unloadRecord() {
        calledUnloadRecord++;
      }

      rollbackAttributes() {
        calledRollbackAttributes++;
      }

      didCommit(data) {
        calledDidCommit++;
      }
    }


    let TestStore = Store.extend({
      createRecordDataFor(modelName, id, clientId, storeWrapper) {
        return new LifecycleRecordData();
      }
    });

    let TestAdapter = Ember.Object.extend({
      updateRecord() {
        called++;
        if (called === 1) {
          return Promise.resolve();
        } else if (called > 1) {
          return Promise.reject();
        }
      },

      createRecord() {
        return Promise.resolve();
      }
    });

    owner.register('service:store', TestStore);
    owner.register('adapter:application', TestAdapter, { singleton: false });

    store = owner.lookup('service:store');

    store.push({
      data: [personHash]
    });

    let person = store.peekRecord('person', '1');
    person.save();
    await settled();
    person.save();
    await settled();
    person.rollbackAttributes();
    person.unloadRecord();
    await settled();
    assert.equal(calledPush, 1, 'Called pushData');
    assert.equal(calledWillCommit, 2, 'Called willCommit');
    assert.equal(calledWasRejected, 1, 'Called commitWasRejected');
    assert.equal(calledUnloadRecord, 1, 'Called unloadRecord');
    assert.equal(calledRollbackAttributes, 1, 'Called rollbackAttributes');
    assert.equal(calledDidCommit, 1, 'Called didCommit');
    assert.equal(calledClientDidCreate, 0, 'Did not called clientDidCreate');

    calledPush = 0;
    calledClientDidCreate = 0;
    calledWillCommit = 0;
    calledWasRejected = 0;
    calledUnloadRecord = 0;
    calledRollbackAttributes = 0;
    calledDidCommit = 0;

    let clientPerson = store.createRecord('person', { id: 2 });
    clientPerson.save();
    await settled();
    clientPerson.save();
    await settled();
    clientPerson.unloadRecord();
    await settled();
    assert.equal(calledPush, 0, 'Called pushData');
    assert.equal(calledWillCommit, 2, 'Called willCommit');
    assert.equal(calledWasRejected, 1, 'Called commitWasRejected');
    assert.equal(calledUnloadRecord, 1, 'Called unloadRecord');
    assert.equal(calledDidCommit, 1, 'Called didCommit');
    assert.equal(calledClientDidCreate, 1, 'Did not called clientDidCreate');



  });
});