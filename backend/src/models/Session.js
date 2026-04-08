const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['interviewer', 'candidate'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema(
  {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    role: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    transcript: [messageSchema],
    feedback: {
      strengths: [String],
      weaknesses: [String],
      communicationScore: Number,
      technicalScore: Number,
      suggestions: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
