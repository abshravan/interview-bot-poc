/**
 * In-memory fallback store.
 *
 * Used automatically when MongoDB is not configured.  Provides the same
 * async API surface as the Mongoose models so routes don't need branching
 * logic — data simply lives in process memory for the lifetime of the server.
 */

const { randomUUID } = require('crypto');

const resumeData  = new Map();   // id → { filename, text }
const sessionData = new Map();   // id → { resumeId, role, status, transcript, notes, feedback }

// ── Document wrapper ──────────────────────────────────────────────────────────
// Adds a .save() method to a plain object so it behaves like a Mongoose doc.
function wrap(id, fields, store) {
  const doc = { _id: id, ...fields };

  doc.save = async function () {
    const snapshot = {};
    for (const [k, v] of Object.entries(this)) {
      if (k === 'save') continue;
      // Populated sub-docs → store just the ID string
      if (k !== '_id' && v && typeof v === 'object' && !Array.isArray(v) && '_id' in v) {
        snapshot[k] = String(v._id);
      } else {
        snapshot[k] = v;
      }
    }
    store.set(id, snapshot);
    return this;
  };
  return doc;
}

// ── Resume ────────────────────────────────────────────────────────────────────
const Resume = {
  async create({ filename, text }) {
    const id = randomUUID();
    resumeData.set(id, { filename, text });
    return wrap(id, { filename, text }, resumeData);
  },

  async findById(id) {
    const fields = resumeData.get(String(id));
    return fields ? wrap(String(id), fields, resumeData) : null;
  },
};

// ── Session ───────────────────────────────────────────────────────────────────
const Session = {
  async create({ resumeId, role }) {
    const id = randomUUID();
    const fields = {
      resumeId: String(resumeId),
      role,
      status: 'active',
      transcript: [],
      notes: '',
      feedback: null,
    };
    sessionData.set(id, fields);
    return wrap(id, { ...fields }, sessionData);
  },

  // Returns a thenable with a chainable .populate() — mirrors Mongoose Query API.
  findById(id) {
    const strId   = String(id);
    let populated = false;

    const query = {
      populate() { populated = true; return this; },
      then(resolve, reject) {
        try {
          const fields = sessionData.get(strId);
          if (!fields) return resolve(null);
          const doc = wrap(strId, { ...fields }, sessionData);
          if (populated) {
            const resumeFields = resumeData.get(String(fields.resumeId));
            if (resumeFields) doc.resumeId = wrap(String(fields.resumeId), resumeFields, resumeData);
          }
          resolve(doc);
        } catch (e) { reject(e); }
      },
    };
    return query;
  },

  async findByIdAndUpdate(id, update, opts = {}) {
    const strId  = String(id);
    const fields = sessionData.get(strId);
    if (!fields) return null;

    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(fields[k])) fields[k] = [];
        fields[k].push({ _id: randomUUID(), ...v });
      }
    }
    for (const [k, v] of Object.entries(update)) {
      if (k !== '$push') fields[k] = v;
    }
    sessionData.set(strId, fields);
    return wrap(strId, { ...fields }, sessionData);
  },
};

module.exports = { Resume, Session };
