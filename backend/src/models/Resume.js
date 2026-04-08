const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    text: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
