import {
  PromiseObject
} from "ember-data/system/promise-proxies";

import { assertPolymorphicType } from "ember-data/utils";

import Relationship from "ember-data/system/relationships/state/relationship";

import {
  create
} from 'ember-data/system/object-polyfills';

var BelongsToRelationship = function(store, record, inverseKey, relationshipMeta) {
  this._super$constructor(store, record, inverseKey, relationshipMeta);
  this.record = record;
  this.key = relationshipMeta.key;
  this.inverseRecord = null;
  this.canonicalState = null;
};

BelongsToRelationship.prototype = create(Relationship.prototype);
BelongsToRelationship.prototype.constructor = BelongsToRelationship;
BelongsToRelationship.prototype._super$constructor = Relationship;

BelongsToRelationship.prototype.setRecord = function(newRecord) {
  if (newRecord) {
    this.addRecord(newRecord);
  } else if (this.inverseRecord) {
    this.removeRecord(this.inverseRecord);
  }
  this.setHasData(true);
};

BelongsToRelationship.prototype.setCanonicalRecord = function(newRecord) {
  if (newRecord) {
    this.addCanonicalRecord(newRecord);
  } else if (this.inverseRecord) {
    this.removeCanonicalRecord(this.inverseRecord);
  }
  this.setHasData(true);
};

BelongsToRelationship.prototype._super$addCanonicalRecord = Relationship.prototype.addCanonicalRecord;
BelongsToRelationship.prototype.addCanonicalRecord = function(newRecord) {
  if (this.canonicalMembers.has(newRecord)) { return;}

  if (this.canonicalState) {
    this.removeCanonicalRecord(this.canonicalState);
  }

  this.canonicalState = newRecord;
  this._super$addCanonicalRecord(newRecord);
};

BelongsToRelationship.prototype._super$flushCanonical = Relationship.prototype.flushCanonical;
BelongsToRelationship.prototype.flushCanonical = function() {
  //temporary fix to not remove newly created records if server returned null.
  //TODO remove once we have proper diffing
  if (this.inverseRecord && this.inverseRecord.isNew() && !this.canonicalState) {
    return;
  }
  this.inverseRecord = this.canonicalState;
  this.record.notifyBelongsToChanged(this.key);
  this._super$flushCanonical();
};

BelongsToRelationship.prototype._super$addRecord = Relationship.prototype.addRecord;
BelongsToRelationship.prototype.addRecord = function(newRecord) {
  if (this.members.has(newRecord)) { return;}

  assertPolymorphicType(this.record, this.relationshipMeta, newRecord);

  if (this.inverseRecord) {
    this.removeRecord(this.inverseRecord);
  }

  this.inverseRecord = newRecord;
  this._super$addRecord(newRecord);
  this.record.notifyBelongsToChanged(this.key);
};

BelongsToRelationship.prototype.setRecordPromise = function(newPromise) {
  var content = newPromise.get && newPromise.get('content');
  Ember.assert("You passed in a promise that did not originate from an EmberData relationship. You can only pass promises that come from a belongsTo or hasMany relationship to the get call.", content !== undefined);
  this.setRecord(content ? content._internalModel : content);
};

BelongsToRelationship.prototype._super$removeRecordFromOwn = Relationship.prototype.removeRecordFromOwn;
BelongsToRelationship.prototype.removeRecordFromOwn = function(record) {
  if (!this.members.has(record)) { return;}
  this.inverseRecord = null;
  this._super$removeRecordFromOwn(record);
  this.record.notifyBelongsToChanged(this.key);
};

BelongsToRelationship.prototype._super$removeCanonicalRecordFromOwn = Relationship.prototype.removeCanonicalRecordFromOwn;
BelongsToRelationship.prototype.removeCanonicalRecordFromOwn = function(record) {
  if (!this.canonicalMembers.has(record)) { return;}
  this.canonicalState = null;
  this._super$removeCanonicalRecordFromOwn(record);
};

BelongsToRelationship.prototype.findRecord = function() {
  if (this.inverseRecord) {
    return this.store._findByInternalModel(this.inverseRecord);
  } else {
    return Ember.RSVP.Promise.resolve(null);
  }
};

BelongsToRelationship.prototype.fetchLink = function() {
  var self = this;
  return this.store.findBelongsTo(this.record, this.link, this.relationshipMeta).then(function(record) {
    if (record) {
      self.addRecord(record);
    }
    return record;
  });
};

BelongsToRelationship.prototype.getRecord = function() {
  //TODO(Igor) flushCanonical here once our syncing is not stupid
  if (this.isAsync) {
    var promise;
    if (this.link) {
      var self = this;
      promise = this.findLink().then(function() {
        return self.findRecord();
      });
    } else {
      promise = this.findRecord();
    }

    return PromiseObject.create({
      promise: promise,
      content: this.inverseRecord ? this.inverseRecord.getRecord() : null
    });
  } else {
    if (this.inverseRecord === null) {
      return null;
    }
    var toReturn = this.inverseRecord.getRecord();
    // Ember.assert("You looked up the '" + this.key + "' relationship on a '" + this.record.type.modelName + "' with id " + this.record.id +  " but some of the associated records were not loaded. Either make sure they are all loaded together with the parent record, or specify that the relationship is async (`DS.belongsTo({ async: true })`)", toReturn === null || !toReturn.get('isEmpty'));
    return toReturn;
  }
};

export default BelongsToRelationship;