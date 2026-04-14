const mongoose = require('mongoose');

const ATLAS_PREFIX = 'mongodb+srv://';
const LOCAL_PREFIX = 'mongodb://';

/**
 * Validate the connection string before hitting DNS.
 * Throws a human-readable error for common mistakes.
 */
function validateUri(uri) {
  if (!uri || !uri.trim()) {
    throw new Error(
      '[db] MONGODB_URI is empty.\n' +
      '  → Copy the connection string from Atlas: Cluster → Connect → Drivers\n' +
      '  → Paste it into backend/.env as MONGODB_URI=mongodb+srv://...'
    );
  }

  const hasPlaceholder = /<[^>]+>/.test(uri);
  if (hasPlaceholder) {
    throw new Error(
      '[db] MONGODB_URI still contains placeholder text (e.g. <username>).\n' +
      '  → Replace every <...> token with your real Atlas credentials.'
    );
  }

  if (!uri.startsWith(ATLAS_PREFIX) && !uri.startsWith(LOCAL_PREFIX)) {
    throw new Error(
      `[db] MONGODB_URI looks wrong — got: "${uri.slice(0, 40)}"\n` +
      '  → It must start with  mongodb+srv://  (Atlas) or  mongodb://  (local).'
    );
  }
}

let dbConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  validateUri(uri);

  mongoose.connection.on('connected',    () => { dbConnected = true;  console.log('[db] MongoDB connected ✓'); });
  mongoose.connection.on('disconnected', () => { dbConnected = false; console.warn('[db] MongoDB disconnected'); });
  mongoose.connection.on('error',        (err) => console.error('[db] MongoDB error:', err.message));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS:          45_000,
    maxPoolSize:              10,
  });
}

function isDbConnected() { return dbConnected; }

module.exports = { connectDB, isDbConnected };
