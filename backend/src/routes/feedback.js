const express = require('express');
const { Session } = require('../lib/store');
const { generateFeedback } = require('../services/feedbackService');

const router = express.Router();

// POST /api/feedback/:sessionId — generate and store feedback
router.post('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId).populate('resumeId');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.transcript.length === 0) {
      return res.status(400).json({ error: 'No transcript found for this session' });
    }

    const feedback = await generateFeedback(session.transcript, session.role);

    session.feedback = feedback;
    session.status = 'completed';
    await session.save();

    res.json(feedback);
  } catch (err) {
    console.error('Feedback generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/:sessionId — retrieve stored feedback
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.feedback?.communicationScore) {
      return res.status(404).json({ error: 'Feedback not yet generated' });
    }
    res.json(session.feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
