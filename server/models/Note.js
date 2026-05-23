const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'New Note',
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true   // Mongoose auto-manages createdAt + updatedAt — no manual hook needed
  }
);

module.exports = mongoose.model('Note', noteSchema);
