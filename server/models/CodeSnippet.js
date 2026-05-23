const mongoose = require('mongoose');

const codeSnippetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'script',
      trim: true,
      maxlength: 200
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'cpp', 'java'],
      default: 'javascript'
    },
    code: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true   // auto createdAt + updatedAt
  }
);

module.exports = mongoose.model('CodeSnippet', codeSnippetSchema);
