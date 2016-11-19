/* MongoosePlugin
 *
 * A plugin middleware for AuditLog and Mongoose that automates the propagation of event logging for Mongoose callbacks
 *
 */
const deepAssign = require('deep-assign');
const util = require('util');

const MongoosePlugin = function(options) {
  this._options = {
    auditLog: null,         // instance of AuditLog
    modelName: 'untitled',  // string name of model
    namePath: null,         // path to readable object name field
    userIdPath: null,       // path to user id
    idPath: '_id',          // path to unique ID field
    versionPath: '__v',     // path to mongoose object version number
    debug: false,           // show debug messages
    storeDoc: ['remove'],  // name of callbacks that should store document in description field, if any
    messages: {
      created: 'Created "%s"',
      updated: 'Updated "%s"',
      removed: 'Removed "%s"'
    }
  };

  deepAssign(this._options, options);
};

/**
 * Mongoose handler
 *
 * This is a mongoose plugin-able handler function.  Example:
 *
 * var auditFn = auditLog.getPlugin('mongoose', {modelName:'myModel', namePath:'title'});
 * MySchema.plugin(auditFn.handler);
 *
 */
MongoosePlugin.prototype.handler = function(schema) {
  function log(document, action, description) {
    const actor = document[this._options.userIdPath] || null;
    this.auditLog.logEvent(actor, 'mongoose', action, this._options.modelName, document[this._options.idPath], description);
  }

  /**
   * Save callback
   */
  schema.post('save', function (doc) {
    const document = doc.toObject();
    const isNew = Object.prototype.hasOwnProperty.call(document, this._options.versionPath) && document[this._options.versionPath] == 0;
    const action = isNew ? 'created' : 'updated';
    var description = '';

    if (this._options.storeDoc.indexOf('save') >= 0) {
      description = JSON.stringify(document);
    } else {
      description = util.format(this._options.messages[action], document[this._options.namePath]);
    }

    log(document, action, description);
  });

  /**
   * Remove callback
   */
  schema.post('remove', function (doc) {
    const document = doc.toObject();
    const action = 'removed';
    var description = '';

    if (this._options.storeDoc.indexOf('remove') >= 0) {
      description = JSON.stringify(document);
    } else {
      description = util.format(this._options.message[action], document[this._options.namePath]);
    }

    log(document, 'remove', description);
  });
};

exports = module.exports = MongoosePlugin;