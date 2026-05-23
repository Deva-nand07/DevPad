const express  = require('express');
const mongoose = require('mongoose');
const Note     = require('../models/Note');
const auth     = require('../middleware/auth');

const router = express.Router();

// Safe ObjectId cast — returns null if invalid
function toObjId(val) {
  const s = String(val || '');
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

// GET / — all notes for this user
router.get('/', auth, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    if (!userId) return res.status(400).json({ message: 'Bad user id' });
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json(notes);
  } catch (e) {
    console.error('[GET /notes]', e);
    res.status(500).json({ message: e.message });
  }
});

// POST / — create new note
router.post('/', auth, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    if (!userId) return res.status(400).json({ message: 'Bad user id' });

    const title   = String(req.body.title   || 'New Note').trim().slice(0, 100);
    const content = String(req.body.content || '');

    const note = await Note.create({ userId, title, content });
    console.log(`[POST /notes] created "${title}" uid=${userId}`);
    res.status(201).json(note);
  } catch (e) {
    console.error('[POST /notes]', e);
    res.status(500).json({ message: e.message });
  }
});

// PUT /:id — update existing note
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    const noteId = toObjId(req.params.id);
    if (!userId || !noteId) return res.status(400).json({ message: 'Bad id' });

    const title   = String(req.body.title   || 'New Note').trim().slice(0, 100);
    const content = String(req.body.content || '');

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { $set: { title, content } },
      { new: true, runValidators: false }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    console.log(`[PUT /notes/${noteId}] updated "${title}"`);
    res.json(note);
  } catch (e) {
    console.error('[PUT /notes]', e);
    res.status(500).json({ message: e.message });
  }
});

// DELETE /:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);
    const noteId = toObjId(req.params.id);
    if (!userId || !noteId) return res.status(400).json({ message: 'Bad id' });
    const note = await Note.findOneAndDelete({ _id: noteId, userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[DELETE /notes]', e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
