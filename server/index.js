const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes    = require('./routes/auth');
const notesRoutes   = require('./routes/notes');
const codeRoutes    = require('./routes/code');
const executeRoutes = require('./routes/execute');
const resetRoutes   = require('./routes/reset');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://dev-pad-lyart.vercel.app']
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/notes',  notesRoutes);
app.use('/api/code',   codeRoutes);
app.use('/api/execute',executeRoutes);
app.use('/api/reset',  resetRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'DevPad API is running 🚀' });
});

// Global error handler — catches any unhandled route errors
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Connect to MongoDB (Compass - local)
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB (Compass)');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
