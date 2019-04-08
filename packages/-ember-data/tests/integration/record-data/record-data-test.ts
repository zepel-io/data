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
    assert.expect(5);
    let called = 0;
    const personHash = {
      type: 'person',
      id: '1',
      attributes: {
        name: 'Scumbag Dale',
      }
    }
    let { owner } = this;
    class LifecycleRecordData extends TestRecordData {
      pushData(data, calculateChange?: boolean) {
        assert.deepEqual(data, personHash, 'called push succesfully')
      }

      willCommit() {
        assert.ok(true, 'willCommit called');
      }

      commitWasRejected() {
        assert.ok(true, 'commit rejected called');
      }

      unloadRecord() {
        assert.ok(true, 'unload called');
      }

      rollbackAttributes() {
        assert.ok(true, 'rollback Attributes called');
      }

      didCommit(data) {
        assert.ok(true, 'didCommit called');
      }
    }


    let TestStore = Store.extend({
      createRecordDataFor(modelName, id, clientId, storeWrapper) {
        return new LifecycleRecordData();
      }
    });

    let TestAdapter =  Ember.Object.extend({
      updateRecord() {
        called++;
        if (called === 1) {
          return Promise.resolve();
        } else if (called === 2) {
          return Promise.reject();
        }
      }
    }); 

    /*
    env = setupStore({
      adapter: DS.Adapter.extend({
        updateRecord() {
          return Promise.resolve();
        }
      }),
      store: CustomS
    });
    */
    owner.register('service:store', TestStore);
    owner.register('adapter:application', TestAdapter, {singleton: false});

    store = owner.lookup('service:store');

    store.push({
      data: [ personHash ]
    });

    let person = store.peekRecord('person', '1');
    person.save();
    await settled();
    person.save();
    await settled();
    person.rollbackAttributes();
    //person.unloadRecord();
    await settled();
  });
});