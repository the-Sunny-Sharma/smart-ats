const { validationResult } = require('express-validator');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Candidate = require('../models/Candidate.model');
const Application = require('../models/Application.model');
const axios = require('axios');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a fingerprint for duplicate detection: hash of lowercased name+email */
const buildFingerprint = (name, email) =>
  crypto.createHash('md5').update(`${name.toLowerCase()}${email.toLowerCase()}`).digest('hex');

/**
 * Extract plain text from an uploaded resume file.
 * Supports PDF, DOC, DOCX.
 * Returns empty string on failure so the rest of the flow still works.
 */
const extractTextFromFile = async (filePath, mimetype) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      // pdf-parse v2 uses a class-based API: new PDFParse({ data: buffer })
      const { PDFParse } = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text || '';
    }

    if (ext === '.docx' || ext === '.doc') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }

    console.warn(`[extractTextFromFile] Unsupported extension: ${ext}`);
    return '';
  } catch (err) {
    console.warn(`[extractTextFromFile] Failed to extract text from ${filePath}:`, err.message);
    return '';
  }
};

/**
 * Call the AI service to parse a resume.
 * Falls back gracefully if the AI service is unavailable.
 */
const parseResumeViaAI = async (resumeText) => {
  try {
    const { data } = await axios.post(
      `${process.env.AI_SERVICE_URL}/parse-resume`,
      { text: resumeText },
      { timeout: 20_000 }
    );
    return data.profile || null;
  } catch (err) {
    console.warn('[candidate.controller] AI service unavailable, skipping parse:', err.message);
    return null;
  }
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/** GET /api/candidates — paginated list with search & filters */
exports.getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search, source, tags,
      sortBy = 'createdAt', order = 'desc',
    } = req.query;

    const filter = {};
    if (source) filter.source = source;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) filter.$text = { $search: search };

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .populate('addedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('-resumeText'), // exclude large field from lists
      Candidate.countDocuments(filter),
    ]);

    res.json({ candidates, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/candidates/:id */
exports.getById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('addedBy', 'name email avatar');
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/candidates — create manually or via form */
exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email } = req.body;

    // Duplicate detection
    const fingerprint = buildFingerprint(name, email);
    const duplicate = await Candidate.findOne({ fingerprint });
    if (duplicate) {
      return res.status(409).json({
        error: 'Candidate with this name and email already exists',
        existingId: duplicate._id,
      });
    }

    const candidate = await Candidate.create({
      ...req.body,
      fingerprint,
      addedBy: req.user._id,
    });

    res.status(201).json({ candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** PUT /api/candidates/:id */
exports.update = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('addedBy', 'name email avatar');

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** DELETE /api/candidates/:id */
exports.remove = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/candidates/upload-resume
 * Handles multipart upload, extracts text from the file, triggers AI parsing.
 */
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    const filePath = req.file.path; // absolute path on disk — set by multer diskStorage

    // ── Step 1: Extract text from the uploaded file ──────────────────────────
    console.log(`[uploadResume] Extracting text from ${req.file.filename}`);
    const resumeText = await extractTextFromFile(filePath, req.file.mimetype);

    if (!resumeText || resumeText.trim().length < 50) {
      console.warn('[uploadResume] Extracted text too short, AI parse will be skipped');
    } else {
      console.log(`[uploadResume] Extracted ${resumeText.length} chars — sending to AI`);
    }

    // ── Step 2: Call AI to parse the extracted text ──────────────────────────
    const parsedProfile = await parseResumeViaAI(resumeText);

    // ── Step 3: Patch in contact info from AI if the form fields were empty ──
    // The AI returns contactInfo — use it to fill missing name/email/phone/location
    const contactInfo = parsedProfile?.contactInfo || {};

    const name  = req.body.name?.trim()  || contactInfo.name     || 'Unknown';
    const email = req.body.email?.trim() || contactInfo.email    || `unknown-${Date.now()}@placeholder.com`;
    const phone = req.body.phone?.trim() || contactInfo.phone    || undefined;
    const location = req.body.location?.trim() || contactInfo.location || undefined;

    // ── Step 4: Save candidate with parsed profile ───────────────────────────
    const candidate = await Candidate.create({
      name,
      email,
      phone,
      location,
      linkedIn:   contactInfo.linkedin || undefined,
      github:     contactInfo.github   || undefined,
      resumeUrl,
      resumeText, // stored for AI scoring later
      parsedProfile: parsedProfile
        ? {
            summary:         parsedProfile.summary         || '',
            skills:          parsedProfile.skills          || [],
            experience:      parsedProfile.experience      || [],
            education:       parsedProfile.education       || [],
            totalExperience: parsedProfile.totalExperience || 0,
            keywords:        parsedProfile.keywords        || [],
          }
        : {},
      source: 'upload',
      fingerprint: buildFingerprint(name, email),
      addedBy: req.user._id,
    });

    res.status(201).json({
      candidate,
      resumeUrl,
      parsed: !!parsedProfile, // tell the frontend whether parsing succeeded
    });
  } catch (err) {
    console.error('[uploadResume] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/candidates/:id/applications — all jobs this candidate applied to */
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.params.id })
      .populate('job', 'title department status')
      .sort({ appliedAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};