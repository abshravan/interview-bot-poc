const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are accepted'));
  },
});

// POST /api/resume/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Parse PDF in-process — no separate Python service required
    let text;
    try {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text?.trim();
    } catch (parseErr) {
      console.error('PDF parse error:', parseErr.message);
      return res.status(422).json({ error: 'Could not extract text from the PDF. Make sure it is not scanned/image-only.' });
    }

    if (!text) {
      return res.status(422).json({ error: 'PDF appears to contain no extractable text (may be image-based).' });
    }

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
