const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas.
 *
 * The MONGODB_URI must be a mongodb+srv:// connection string from Atlas.
 * Example:
 *   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/interview_bot?retryWrites=true&w=majority
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Set it to your MongoDB Atlas connection string.');
  }

  mongoose.connection.on('connected',    () => console.log('[db] MongoDB Atlas connected'));
  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB Atlas disconnected'));
  mongoose.connection.on('error',        (err) => console.error('[db] MongoDB error:', err.message));

  await mongoose.connect(uri, {
    // Atlas-recommended settings
    retryWrites:       true,
    serverSelectionTimeoutMS: 10_000,   // fail fast if Atlas unreachable
    socketTimeoutMS:          45_000,
    maxPoolSize:              10,
  });
}

module.exports = { connectDB };
