const express = require('express');
const axios   = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── Judge0 CE — no API key needed on public instance ──────────────────
const JUDGE0_URL = 'https://ce.judge0.com';

const JUDGE0_LANG_IDS = {
  javascript: 93,  // Node.js 18
  python:     71,  // Python 3.8
  cpp:        54,  // C++ (GCC 9.2.0)
  java:       62,  // Java (OpenJDK 13)
};

async function runViaJudge0(language, code) {
  const langId = JUDGE0_LANG_IDS[language];
  if (!langId) throw new Error(`Unsupported language: ${language}`);

  const encoded = Buffer.from(code).toString('base64');

  // Submit
  const submitRes = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`,
    { language_id: langId, source_code: encoded, stdin: '' },
    { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, timeout: 10000 }
  );

  const { token } = submitRes.data;
  if (!token) throw new Error('Judge0 did not return a token');

  // Poll until done (max 15s)
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const pollRes = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`,
      { headers: { 'Accept': 'application/json' }, timeout: 10000 }
    );
    const data     = pollRes.data;
    const statusId = data.status?.id;
    if (statusId <= 2) continue; // queued / processing

    const decode = (b64) => (b64 ? Buffer.from(b64, 'base64').toString('utf8') : '');
    const stdout      = decode(data.stdout);
    const stderr      = decode(data.stderr);
    const compileErr  = decode(data.compile_output);
    const errText     = compileErr || stderr || '';

    return { output: stdout, error: errText || null };
  }
  throw new Error('Execution timed out (15s)');
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: 'Language and code are required' });
    }

    if (!JUDGE0_LANG_IDS[language]) {
      return res.status(400).json({ message: `Unsupported language. Use: ${Object.keys(JUDGE0_LANG_IDS).join(', ')}` });
    }

    const { output, error } = await runViaJudge0(language, code);
    res.json({ output, error });

  } catch (err) {
    if (err.response) {
      res.status(502).json({ message: 'Judge0 API error', error: err.response.data?.message || err.response.statusText });
    } else if (err.code === 'ECONNABORTED') {
      res.status(504).json({ message: 'Execution timed out' });
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      res.status(503).json({ message: 'Cannot reach Judge0 API. Check internet connection.' });
    } else {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
});

module.exports = router;
