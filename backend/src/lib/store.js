/**
 * Storage dispatcher.
 *
 * Transparently routes each call to either the real Mongoose models (when
 * MongoDB is connected) or the in-memory fallback (when it is not).  Checks
 * are performed at *call time*, not at require time, so the decision is made
 * correctly even if MongoDB connects (or drops) after the server starts.
 */

const { isDbConnected } = require('../config/db');
const MongoResume  = require('../models/Resume');
const MongoSession = require('../models/Session');
const mem          = require('./memStore');

const Resume = {
  create:   (...a) => (isDbConnected() ? MongoResume  : mem.Resume ).create(...a),
  findById: (...a) => (isDbConnected() ? MongoResume  : mem.Resume ).findById(...a),
};

const Session = {
  create:             (...a) => (isDbConnected() ? MongoSession : mem.Session).create(...a),
  findById:           (id)   => (isDbConnected() ? MongoSession : mem.Session).findById(id),
  findByIdAndUpdate:  (...a) => (isDbConnected() ? MongoSession : mem.Session).findByIdAndUpdate(...a),
};

module.exports = { Resume, Session };
