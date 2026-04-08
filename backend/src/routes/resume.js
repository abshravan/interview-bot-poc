const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Resume = require('../models/Resume');

const router = express.Router();

// Store file in memory so we can forward it to the Python parser
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are accepted'));
  },
});

// POST /api/resume/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Forward the PDF to the Python resume parser
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: 'application/pdf',
    });

    const parserRes = await axios.post(
      `${process.env.RESUME_PARSER_URL}/parse`,
      form,
      { headers: form.getHeaders() }
    );

    const { text } = parserRes.data;

    const resume = await Resume.create({
      filename: req.file.originalname,
      text,
    });

    res.status(201).json({ resumeId: resume._id, filename: resume.filename });
  } catch (err) {
    console.error('Resume upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resume/:id
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
