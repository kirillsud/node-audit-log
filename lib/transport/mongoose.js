// Module dependencies
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const util = require('util');

/**
 * MongooseTransport
 *
 * A MongoDB storage handler for Audit-Log for Node.js
 *
 */
const MongooseTransport = function(options) {
  this.name = 'mongoose';

  this._options = {collectionName: 'auditLog', connectionString: '', debug: false};

  // override default options with the provided values
  if (typeof options !== 'undefined') {
    for (var attr in options) {
      this._options[attr] = options[attr];
    }
  }

  // attempt to setup the db connection
  if (this._options.connectionString) {
    this._connection = mongoose.createConnection(this._options.connectionString, function (err) {
      if (err) {
        this.debugMessage("could not connect to DB: " + err);
      }
    });
  } else {
    this._connection = mongoose;
  }

  this.modelSchema = new Schema({
    actor: {type: String},
    date: {type: Date},
    origin: {type: String},
    action: {type: String},
    label: {type: String},
    object: {type: String},
    description: {type: String}
  });

  this.model = this._connection.model(this._options.collectionName, this.modelSchema);

  this.emit = function (dataObject) {
    this.debugMessage('emit: ' + util.inspect(dataObject));

    if (dataObject.logType && dataObject.logType == 'Event') {
      var newEvent = new this.model(dataObject);
      newEvent.save(function (err) {
        if (err) this.debugMessage('error saving event to database: ' + err);
      });
    }
  };

  this.debugMessage = function (msg) {
    if (this._options.debug) console.log('Audit-Log(mongoose): ' + msg);
  };

  return this;
};

exports = module.exports = MongooseTransport;