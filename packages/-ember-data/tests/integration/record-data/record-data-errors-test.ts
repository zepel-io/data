import { get } from '@ember/object';
import { setupTest } from 'ember-qunit';
import Model from 'ember-data/model';
import Store from 'ember-data/store';
import { module, test } from 'qunit';
import { settled } from '@ember/test-helpers';
import EmberObject from '@ember/object';
import { attr, hasMany, belongsTo } from '@ember-data/model';
import { InvalidError, ServerError } from '@ember-data/adapter/error';

interface RecordIdentifier {
  id?: string;
  type: string;
  lid: string;
}

interface JsonApiValidationError {
  title: string;
  detail: string;
  source: {
    pointer: string;
  }
}

class Person extends Model {
  // TODO fix the typing for naked attrs
  @attr('string', {})
  name;
}

class House extends Model {
  // TODO fix the typing for naked attrs
  @attr('string', {})
  name;

  @belongsTo('person', { async: false })
  landlord;

  @hasMany('person', { async: false })
  tenants;
}


// TODO: this should work
// class TestRecordData implements RecordData
class TestRecordData {

  commitWasRejected(recordIdentifier: RecordIdentifier, errors?: JsonApiValidationError[]): void {

  }

  getErrors(recordIdentifier: RecordIdentifier): JsonApiValidationError[] {
    return [];
  }

  // Use correct interface once imports have been fix
  _storeWrapper: any;

  pushData(data, calculateChange?: boolean) { }
  clientDidCreate() { }

  willCommit() { }

  unloadRecord() { }
  rollbackAttributes() { }
  changedAttributes(): any { }

  hasChangedAttributes(): boolean {
    return false;
  }

  setDirtyAttribute(key: string, value: any) { }

  getAttr(key: string): string {
    return "test";
  }

  hasAttr(key: string): boolean {
    return false;
  }

  getHasMany(key: string) {
    return {};
  }

  isNew() {
    return false;
  }

  isDeleted() {
    return false;
  }

  addToHasMany(key: string, recordDatas: this[], idx?: number) { }
  removeFromHasMany(key: string, recordDatas: this[]) { }
  setDirtyHasMany(key: string, recordDatas: this[]) { }

  getBelongsTo(key: string) { }

  setDirtyBelongsTo(name: string, recordData: this | null) { }

  didCommit(data) { }

  isAttrDirty(key: string) { return false; }
  removeFromInverseRelationships(isNew: boolean) { }

  _initRecordCreateOptions(options) { }
}

let CustomStore = Store.extend({
  createRecordDataFor(modelName, id, clientId, storeWrapper) {
    return new TestRecordData();
  }
});

let houseHash, davidHash, runspiredHash, igorHash;

module('integration/record-data - Custom RecordData Implementations', function (hooks) {
  setupTest(hooks);

  let store;

  hooks.beforeEach(function () {
    let { owner } = this;

    houseHash = {
      type: 'house',
      id: '1',
      attributes: {
        name: 'Moomin'
      }
    };

    davidHash = {
      type: 'person',
      id: '1',
      attributes: {
        name: 'David'
      }
    };

    runspiredHash = {
      type: 'person',
      id: '2',
      attributes: {
        name: 'Runspired'
      }
    };

    igorHash = {
      type: 'person',
      id: '3',
      attributes: {
        name: 'Igor'
      }
    };

    owner.register('model:person', Person);
    owner.register('model:house', House);
    owner.register('service:store', CustomStore);
  });

  test("Record Data invalid errors", async function (assert) {
    assert.expect(17);
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

    class LifecycleRecordData extends TestRecordData {
      commitWasRejected(recordIdentifier, errors) {
        assert.equal(errors[0].detail, 'is a generally unsavoury character', 'received the error');
        assert.equal(errors[0].source.pointer, '/data/attributes/name', 'pointer is correct');
      }
    }

    let TestStore = Store.extend({
      createRecordDataFor(modelName, id, clientId, storeWrapper) {
        return new LifecycleRecordData();
      }
    });

    let TestAdapter = EmberObject.extend({
      updateRecord() {
        return Promise.reject(new InvalidError([
          {
            title: 'Invalid Attribute',
            detail: 'is a generally unsavoury character',
            source: {
              pointer: '/data/attributes/name',
            },
          },
        ]));
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
    person.save().then(() => {}, (err) => {

    });
  });

  test("Record Data adapter errors", async function (assert) {
    assert.expect(17);
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

    class LifecycleRecordData extends TestRecordData {
      commitWasRejected(recordIdentifier, errors) {
        assert.equal(errors, undefined, 'Did not pass adapter errors');
      }
    }

    let TestStore = Store.extend({
      createRecordDataFor(modelName, id, clientId, storeWrapper) {
        return new LifecycleRecordData();
      }
    });

    let TestAdapter = EmberObject.extend({
      updateRecord() {
        return Promise.reject();
      },
    });

    owner.register('service:store', TestStore);
    owner.register('adapter:application', TestAdapter, { singleton: false });

    store = owner.lookup('service:store');

    store.push({
      data: [personHash]
    });
    let person = store.peekRecord('person', '1');
    await person.save().then(() => {}, (err) => {
    });
  });

  test("Record Data adapter errors", async function (assert) {
    assert.expect(17);
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

    class LifecycleRecordData extends TestRecordData {
      getErrors(recordIdentifier: RecordIdentifier): JsonApiValidationError[] {
        return [{
            title: 'Invalid Attribute',
            detail: '',
            source: {
              pointer: '/data/attributes/name',
            },
        }];
      }
    }

    let TestStore = Store.extend({
      createRecordDataFor(modelName, id, clientId, storeWrapper) {
        return new LifecycleRecordData();
      }
    });

    let TestAdapter = EmberObject.extend({
      updateRecord() {
        return Promise.reject();
      },
    });

    owner.register('service:store', TestStore);
    owner.register('adapter:application', TestAdapter, { singleton: false });

    store = owner.lookup('service:store');

    store.push({
      data: [personHash]
    });
    let person = store.peekRecord('person', '1');
    await person.save().then(() => {}, (err) => {

    });
  });

  test("Getting errors from Record Data shows up on the record igor", async function (assert) {
    assert.expect(17);
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

    class LifecycleRecordData extends TestRecordData {
      getErrors(recordIdentifier: RecordIdentifier): JsonApiValidationError[] {
        return [{
            title: 'Invalid Attribute',
            detail: '',
            source: {
              pointer: '/data/attributes/name',
            },
        }];
      }
    }

    let TestStore = Store.extend({
      createRecordDataFor(modelName, id, clientId, storeWrapper) {
        return new LifecycleRecordData();
      }
    });


    owner.register('service:store', TestStore);

    store = owner.lookup('service:store');


    store.push({
      data: [personHash]
    });
    let person = store.peekRecord('person', '1');
    debugger
    person.get('errors')

  });
});
