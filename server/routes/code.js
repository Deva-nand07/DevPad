const express = require('express');
const mongoose = require('mongoose');
const CodeSnippet = require('../models/CodeSnippet');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const toObjId = (id) => {
  try { return new mongoose.Types.ObjectId(id); }
  catch { return null; }
};

// GET last saved snippet
router.get('/last', authMiddleware, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    const snippet = await CodeSnippet.findOne({ userId }).sort({ updatedAt: -1 });
    res.json(snippet || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all snippets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    const snippets = await CodeSnippet.find({ userId }).sort({ updatedAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create new snippet
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    if (!userId) return res.status(400).json({ message: 'Invalid user id' });
    const { title, language, code, output } = req.body;
    const snippet = new CodeSnippet({ userId, title, language, code });
    await snippet.save();
    res.status(201).json(snippet);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update existing snippet
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    const snippetId = toObjId(req.params.id);
    if (!userId || !snippetId) return res.status(400).json({ message: 'Invalid id' });
    const { title, language, code, output } = req.body;
    const snippet = await CodeSnippet.findOneAndUpdate(
      { _id: snippetId, userId },
      { title, language, code, output },
      { new: true }
    );
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE snippet
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    const snippetId = toObjId(req.params.id);
    if (!userId || !snippetId) return res.status(400).json({ message: 'Invalid id' });
    const snippet = await CodeSnippet.findOneAndDelete({ _id: snippetId, userId });
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
