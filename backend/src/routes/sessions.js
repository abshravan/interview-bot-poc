const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const Resume = require('../models/Resume');

const router = express.Router();

// POST /api/sessions — create a new interview session
router.post('/', async (req, res) => {
  try {
    const { resumeId, role } = req.body;
    if (!resumeId || !role) {
      return res.status(400).json({ error: 'resumeId and role are required' });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const session = await Session.create({ resumeId, role });
    res.status(201).json({ sessionId: session._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('resumeId');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/transcript — append a message
router.post('/:id/transcript', async (req, res) => {
  try {
    const { role, content } = req.body;
    if (!role || !content) {
      return res.status(400).json({ error: 'role and content are required' });
    }

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { $push: { transcript: { role, content } } },
      { new: true }
    );

    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id/notes — save personal notes
router.patch('/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;
    if (typeof notes !== 'string') {
      return res.status(400).json({ error: 'notes must be a string' });
    }
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id/complete
router.patch('/:id/complete', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
