import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Play, RotateCcw, Download, LogOut,
  ChevronDown, X, Plus, Layers, FileText, Code2,
  Save, Check, Edit2, User, FolderOpen, Trash2
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import NotesPanel from '../components/NotesPanel';
import OutputConsole from '../components/OutputConsole';
import CodingTimer from '../components/CodingTimer';
import api from '../api/axios';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: '.js',   defaultName: 'script',  color: '#f59e0b', judge0Id: 93  },
  { id: 'python',     label: 'Python',     ext: '.py',   defaultName: 'main',    color: '#3b82f6', judge0Id: 71  },
  { id: 'cpp',        label: 'C++',        ext: '.cpp',  defaultName: 'main',    color: '#00d4ff', judge0Id: 54  },
  { id: 'java',       label: 'Java',       ext: '.java', defaultName: 'Main',    color: '#10b981', judge0Id: 62  },
];

const DEFAULT_CODE = {
  javascript: `// Welcome to DevPad
console.log("Hello DevPad_user");
`,
  python:     `# Welcome to DevPad
print("Hello DevPad_user")
`,
  cpp:        `// Welcome to DevPad
#include<iostream>
using namespace std;
int main() {
  cout<<"Hello DevPad_user"<<endl;
  return 0;
}
`,
  java:       `// Welcome to DevPad
public class Main {
  public static void main(String[] args) {
    System.out.println("Hello DevPad_user");
  }
}
`,
};

const MODES = [
  { id: 'workspace', icon: Layers,   label: 'Workspace' },
  { id: 'notes',     icon: FileText, label: 'Notes Only' },
  { id: 'code',      icon: Code2,    label: 'Code Only'  },
];

const JUDGE0_LANG_IDS = {
  javascript: 93,   // Node.js 18
  python:     71,   // Python 3.8
  cpp:        54,   // C++ (GCC 9.2)
  java:       62,   // Java (OpenJDK 13)
};

// Multiple public Judge0 CE endpoints — tries each in order
const JUDGE0_HOSTS = [
  'https://judge0-ce.p.rapidapi.com',   // RapidAPI (free tier, needs header but works without key for low usage)
  'https://ce.judge0.com',
];

async function runViaJudge0(langConfig, code) {
  const langId = JUDGE0_LANG_IDS[langConfig.id];
  if (!langId) throw new Error(`No Judge0 ID for language: ${langConfig.id}`);

  const encoded = btoa(unescape(encodeURIComponent(code)));

  // Try each host
  for (const host of JUDGE0_HOSTS) {
    try {
      // Submit
      const submitRes = await fetch(`${host}/submissions?base64_encoded=true&wait=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ language_id: langId, source_code: encoded, stdin: '' }),
      });
      if (!submitRes.ok) continue;
      const { token } = await submitRes.json();
      if (!token) continue;

      // Poll until done (max 15s)
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await fetch(`${host}/submissions/${token}?base64_encoded=true`, {
          headers: { 'Accept': 'application/json' },
        });
        if (!pollRes.ok) break;
        const data = await pollRes.json();
        const statusId = data.status?.id;
        if (statusId <= 2) continue; // queued / processing

        const decode = (b64) => {
          if (!b64) return '';
          try { return decodeURIComponent(escape(atob(b64))); } catch { return atob(b64); }
        };

        const stdout = decode(data.stdout);
        const stderr = decode(data.stderr);
        const compileErr = decode(data.compile_output);
        const errText = compileErr || stderr || '';

        return { output: stdout, error: errText || null };
      }
    } catch { continue; }
  }
  throw new Error('All Judge0 endpoints failed. Check your internet connection.');
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [language, setLanguage]         = useState('javascript');
  const [code, setCode]                 = useState(DEFAULT_CODE.javascript);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [output, setOutput]             = useState('');
  const [error, setError]               = useState('');
  const [running, setRunning]           = useState(false);
  const [workspaceName, setWorkspaceName] = useState('My Dev Workspace');
  const [editingName, setEditingName]   = useState(false);
  const [mode, setMode]                 = useState('workspace');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [toast, setToast]               = useState(null);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [snippetIds, setSnippetIds]     = useState({});  // tabId → DB _id
  const [showSaved, setShowSaved]       = useState(false);
  const [savedFiles, setSavedFiles]     = useState({ code: [], notes: [] });
  const editorRef      = useRef(null);
  const notesPanelRef  = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Tabs: each tab has { id, lang, fileName (stem only, no ext) }
  const [tabs, setTabs]     = useState([{ id: 1, lang: 'javascript', fileName: 'script' }]);
  const [activeTab, setActiveTab] = useState(1);

  // Tab rename state
  const [renamingTab, setRenamingTab]         = useState(null);
  const [renameValue, setRenameValue]         = useState('');
  const renameInputRef                        = useRef(null);

  // Panel split
  const [splitPos, setSplitPos]         = useState(30);
  const [editorSplit, setEditorSplit]   = useState(65);
  const draggingRef                     = useRef(false);

  useEffect(() => {
    const loadLastCode = async () => {
      try {
        const res = await api.get('/code');
        const snippets = res.data || [];
        if (snippets.length === 0) return;
        // Prefer snippet matching current language, else take most recent
        const match = snippets.find(s => s.language === language) || snippets[0];
        setCode(match.code);
        setLanguage(match.language);
        const langCfg = LANGUAGES.find(l => l.id === match.language);
        const stem = match.title.replace(/\.[^.]+$/, '');
        setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, lang: match.language, fileName: stem } : t));
        setSnippetIds(prev => ({ ...prev, [activeTab]: match._id }));
      } catch {}
    };
    loadLastCode();
  }, []);

  // Focus rename input when it opens
  useEffect(() => {
    if (renamingTab && renameInputRef.current) renameInputRef.current.focus();
  }, [renamingTab]);

  // ── Resize ────────────────────────────────────────────────────────
  const startHResize = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    const startX = e.clientX, startPos = splitPos;
    const containerWidth = e.currentTarget.parentElement.getBoundingClientRect().width;
    const onMove = (e) => {
      if (!draggingRef.current) return;
      setSplitPos(Math.max(20, Math.min(60, startPos + ((e.clientX - startX) / containerWidth) * 100)));
    };
    const onUp = () => { draggingRef.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [splitPos]);

  const startVResize = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY, startPos = editorSplit;
    const containerH = e.currentTarget.parentElement.getBoundingClientRect().height;
    const onMove = (e) => setEditorSplit(Math.max(30, Math.min(85, startPos + ((e.clientY - startY) / containerH) * 100)));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [editorSplit]);

  // ── Language change ───────────────────────────────────────────────
  const changeLanguage = (lang) => {
    const langCfg = LANGUAGES.find(l => l.id === lang);
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setLangMenuOpen(false);
    setOutput(''); setError('');
    // Update current tab's lang and reset fileName to default
    setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, lang, fileName: langCfg?.defaultName || 'script' } : t));
  };

  // ── Tab rename ────────────────────────────────────────────────────
  const startRename = (tabId, currentName, e) => {
    e.stopPropagation();
    setRenamingTab(tabId);
    setRenameValue(currentName);
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setTabs(prev => prev.map(t => t.id === renamingTab ? { ...t, fileName: trimmed } : t));
    }
    setRenamingTab(null);
  };

  const getTabDisplayName = (tab) => {
    const langCfg = LANGUAGES.find(l => l.id === tab.lang);
    return (tab.fileName || langCfg?.defaultName || 'script') + (langCfg?.ext || '.js');
  };

  // ── Run code ──────────────────────────────────────────────────────
  const runCode = async () => {
    setRunning(true); setOutput(''); setError('');
    const langCfg = LANGUAGES.find(l => l.id === language);

    // Try server first, fall back to Judge0 CE directly from browser
    try {
      const res = await api.post('/execute', { language, code });
      setOutput(res.data.output || '');
      if (res.data.error) setError(res.data.error);
    } catch (serverErr) {
      // Server unreachable — run directly via Judge0 CE (no API key needed)
      try {
        const { output: o, error: e } = await runViaJudge0(langCfg, code);
        setOutput(o);
        if (e) setError(e);
      } catch (judgeErr) {
        setError(`Could not run code.\n\nDetails: ${judgeErr.message}`);
      }
    } finally {
      setRunning(false);
    }
  };

  // ── Smart Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);

    if (mode === 'code' || mode === 'workspace') {
      try {
        const tab          = tabs.find(t => t.id === activeTab);
        const codeFileName = getTabDisplayName(tab || { lang: language, fileName: '' });
        const existingId   = snippetIds[activeTab];

        if (existingId) {
          await api.put(`/code/${existingId}`, { title: codeFileName, language, code, output });
        } else {
          const { data: allSnippets } = await api.get('/code');
          const match = allSnippets.find(s => s.title === codeFileName && s.language === language);
          if (match) {
            await api.put(`/code/${match._id}`, { title: codeFileName, language, code, output });
            setSnippetIds(prev => ({ ...prev, [activeTab]: match._id }));
          } else {
            const { data: created } = await api.post('/code', { title: codeFileName, language, code, output });
            setSnippetIds(prev => ({ ...prev, [activeTab]: created._id }));
          }
        }
      } catch (err) {
        console.error('Code save failed:', err.response?.data || err.message);
      }
    }

    if ((mode === 'notes' || mode === 'workspace') && notesPanelRef.current) {
      try {
        const { id: noteId, title: noteTitle, content: noteContent, isDraft } = notesPanelRef.current.getCurrentNote();
        const trimmedTitle = (noteTitle || 'New Note').trim();
        if (!isDraft && noteId) {
          const { data: updated } = await api.put(`/notes/${noteId}`, { title: trimmedTitle, content: noteContent });
          notesPanelRef.current.onNoteSaved(updated);
        } else {
          const { data: created } = await api.post('/notes', { title: trimmedTitle, content: noteContent });
          notesPanelRef.current.onNoteSaved(created);
        }
      } catch (err) {
        console.error('Note save failed:', err.response?.data || err.message);
      }
    }

    setSaving(false);
    setSaved(true);
    showToast('Saved successfully ✓');
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Export ────────────────────────────────────────────────────────
  // mode='workspace' -> HTML file with code+output+notes
  // mode='code'      -> raw source code file (e.g. main.py)
  // mode='notes'     -> .txt file with note content

  const getNotesText = () => {
    // Try to get notes content from the NotesPanel via a shared ref or just use a DOM scrape fallback
    // We'll rely on a window-level export hook set by NotesPanel
    if (window.__devpadNotesExport) return window.__devpadNotesExport();
    return '';
  };

  const exportFile = () => {
    const tab = tabs.find(t => t.id === activeTab);
    const langCfg = LANGUAGES.find(l => l.id === language);
    const codeFileName = getTabDisplayName(tab || { lang: language, fileName: '' });

    // ── Code Only mode → export raw source file ──────────────────
    if (mode === 'code') {
      const blob = new Blob([code], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = codeFileName;  // e.g. main.py, script.js
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // ── Notes Only mode → export .txt file ───────────────────────
    if (mode === 'notes') {
      const notesContent = getNotesText();
      const blob = new Blob([notesContent], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'notes.txt';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // ── Workspace mode → export full HTML (mirrors actual layout) ───
    const bg        = isDark ? '#0a0a0f'  : '#f0f0f8';
    const bgCard    = isDark ? '#13131f'  : '#ffffff';
    const bgCode    = isDark ? '#0f0f1a'  : '#f5f5ff';
    const bgSidebar = isDark ? '#0d0d18'  : '#e8e8f5';
    const textPrim  = isDark ? '#e8e8f0'  : '#1a1a2e';
    const textSec   = isDark ? '#8888aa'  : '#555577';
    const textMuted = isDark ? '#444466'  : '#9999bb';
    const border    = isDark ? '#1e1e35'  : '#d0d0e8';
    const cyan      = '#00d4ff';
    const purple    = '#a855f7';
    const green     = '#10b981';

    const escapedCode   = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const escapedOutput = (output||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const escapedError  = (error||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const notesRaw      = getNotesText();
    const escapedNotes  = notesRaw
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\n/g,'<br/>');
    const themeLabel  = isDark ? 'Dark' : 'Light';
    const langLabel   = langCfg?.label || language;
    const safeWsName  = workspaceName.replace(/[^a-z0-9_\-. ]/gi, '').trim() || 'workspace';

    const PRISM_LANG = { javascript: 'javascript', python: 'python', cpp: 'cpp', java: 'java' };
    const prismLang = PRISM_LANG[language] || 'javascript';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${workspaceName} — DevPad Export</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@800&display=swap" rel="stylesheet"/>
<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-one-dark.min.css" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${bg};color:${textPrim};font-family:'Space Grotesk',sans-serif;min-height:100vh;display:flex;flex-direction:column}

  /* ── Navbar ── */
  .navbar{height:52px;display:flex;align-items:center;gap:12px;padding:0 16px;border-bottom:1px solid ${border};background:${bgCard};flex-shrink:0}
  .brand{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:${textPrim};display:flex;align-items:center;gap:6px}
  .brand-grad{background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .ws-name{font-size:13px;font-weight:600;color:${textSec};padding:3px 8px;border:1px solid ${border};border-radius:6px}
  .lang-badge{display:flex;align-items:center;gap:6px;padding:4px 10px;background:${bgCode};border:1px solid ${border};border-radius:8px;font-size:12px;font-weight:600;color:${textPrim}}
  .lang-dot{width:8px;height:8px;border-radius:50%;background:${langCfg?.color||cyan}}
  .theme-badge{font-family:'JetBrains Mono',monospace;font-size:11px;padding:3px 9px;border-radius:99px;background:rgba(168,85,247,0.12);color:${purple};border:1px solid rgba(168,85,247,0.25)}
  .meta-right{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:11px;color:${textMuted}}

  /* ── Layout ── */
  .workspace{flex:1;display:flex;overflow:hidden;min-height:0}

  /* ── Notes panel (left) ── */
  .notes-panel{width:35%;min-width:220px;background:${bgCard};border-right:1px solid ${border};display:flex;flex-direction:column}
  .panel-header{padding:10px 14px;border-bottom:1px solid ${border};display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:${textPrim};background:${bgCode};flex-shrink:0}
  .panel-icon{color:${purple}}
  .notes-content{flex:1;padding:16px;font-size:13.5px;line-height:1.8;color:${textSec};overflow-y:auto;white-space:pre-wrap;word-break:break-word}
  .notes-empty{color:${textMuted};font-style:italic}

  /* ── Code + Output panel (right) ── */
  .code-panel{flex:1;display:flex;flex-direction:column;min-width:0}
  .tab-bar{height:38px;display:flex;align-items:center;padding:0 8px;background:${bgSidebar};border-bottom:1px solid ${border};flex-shrink:0}
  .tab{display:flex;align-items:center;gap:6px;padding:0 12px;height:100%;font-family:'JetBrains Mono',monospace;font-size:12px;color:${textPrim};border-bottom:2px solid ${purple};background:${bg}}
  .tab-dot{width:7px;height:7px;border-radius:50%;background:${langCfg?.color||cyan}}

  /* ── Prism overrides ── */
  pre[class*="language-"]{flex:1;margin:0;border-radius:0;background:${bg} !important;font-size:13px;line-height:1.7;overflow:auto}
  code[class*="language-"]{font-family:'JetBrains Mono',monospace !important;font-size:13px}

  /* ── Output console ── */
  .console{border-top:1px solid ${border};background:#000;flex-shrink:0;max-height:180px;overflow-y:auto}
  .console-tabs{display:flex;align-items:center;padding:0 14px;height:36px;border-bottom:1px solid ${border};gap:4px;background:#0a0a0a}
  .ctab{font-family:'JetBrains Mono',monospace;font-size:11px;padding:2px 10px;border-radius:4px;font-weight:500}
  .ctab-output{color:${green};background:rgba(16,185,129,0.1)}
  .ctab-error{color:#ef4444;background:rgba(239,68,68,0.1)}
  pre.console-out{padding:12px 16px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.7;margin:0;white-space:pre-wrap;word-break:break-word;background:transparent !important}
  .out-green{color:${green}}
  .out-red{color:#ef4444}
  .out-muted{color:${textMuted};font-style:italic}

  /* ── Footer ── */
  .footer{padding:10px 20px;border-top:1px solid ${border};font-family:'JetBrains Mono',monospace;font-size:10px;color:${textMuted};text-align:center;background:${bgCard};flex-shrink:0}
  .footer span{color:${purple}}
</style>
</head>
<body>

<!-- Navbar -->
<div class="navbar">
  <div class="brand">Dev<span class="brand-grad">Pad</span></div>
  <div class="ws-name">${workspaceName}</div>
  <div class="lang-badge"><span class="lang-dot"></span>${langLabel}</div>
  <span class="theme-badge">${themeLabel} Theme</span>
  <div class="meta-right">Exported: ${new Date().toLocaleString()}</div>
</div>

<!-- Workspace -->
<div class="workspace">

  <!-- Notes (left) -->
  <div class="notes-panel">
    <div class="panel-header">
      <svg class="panel-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      Notes
    </div>
    <div class="notes-content">${notesRaw ? escapedNotes : '<span class=\\"notes-empty\\">No notes in this workspace.</span>'}</div>
  </div>

  <!-- Code + Output (right) -->
  <div class="code-panel">

    <!-- Tab bar -->
    <div class="tab-bar">
      <div class="tab"><span class="tab-dot"></span>${codeFileName}</div>
    </div>

    <!-- Code with Prism syntax highlighting -->
    <pre class="language-${prismLang}"><code class="language-${prismLang}">${escapedCode}</code></pre>

    <!-- Console -->
    <div class="console">
      <div class="console-tabs">
        ${escapedOutput ? `<span class="ctab ctab-output">Output</span>` : ''}
        ${escapedError  ? `<span class="ctab ctab-error">Errors</span>` : ''}
        ${!escapedOutput && !escapedError ? `<span class="ctab ctab-output">Output</span>` : ''}
      </div>
      ${escapedOutput ? `<pre class="console-out out-green">${escapedOutput}</pre>` : ''}
      ${escapedError  ? `<pre class="console-out out-red">${escapedError}</pre>`   : ''}
      ${!escapedOutput && !escapedError   ? `<pre class="console-out out-muted">No output yet.</pre>` : ''}
    </div>

  </div>
</div>

<!-- Footer -->
<div class="footer">
  <span>DevPad</span> — Code. Note. Focus. Create. &nbsp;|&nbsp; ${langLabel} &nbsp;|&nbsp; ${new Date().toLocaleDateString()}
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${prismLang}.min.js"></script>
</body>
</html>`;

    const safeFileName = (workspaceName || 'workspace').replace(/[^a-z0-9_\-. ]/gi,'').trim().replace(/\s+/g,'-') || 'workspace';
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${safeFileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const currentLang  = LANGUAGES.find(l => l.id === language);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* ─── Top Navbar ─── */}
      <header style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <img src="/devpad_logo.png" alt="DevPad" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>
            Dev<span style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pad</span>
          </span>
        </div>

        {/* Workspace name */}
        {editingName ? (
          <input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)}
            onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)} autoFocus
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--purple)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, outline: 'none', width: 180 }}
          />
        ) : (
          <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {workspaceName}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        )}

        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setLangMenuOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: currentLang?.color, flexShrink: 0 }} />
            {currentLang?.label}
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
          {langMenuOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, zIndex: 100, minWidth: 150, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
              {LANGUAGES.map(lang => (
                <button key={lang.id} onClick={() => changeLanguage(lang.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: language === lang.id ? 'rgba(168,85,247,0.15)' : 'none', border: 'none', borderRadius: 6, color: language === lang.id ? '#a855f7' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (language !== lang.id) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (language !== lang.id) e.currentTarget.style.background = 'none'; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color }} />
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Timer */}
        <CodingTimer />

        {/* Theme Toggle */}
        <button onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.color = '#a855f7'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >{isDark ? <Sun size={15} /> : <Moon size={15} />}</button>

        {/* Run */}
        <button onClick={runCode} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: running ? 'rgba(16,185,129,0.4)' : '#10b981', border: 'none', borderRadius: 8, color: '#0a0a0f', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, cursor: running ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => !running && (e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <Play size={14} fill="currentColor" />
          {running ? 'Running...' : 'Run'}
        </button>

        {/* Reset */}
        <button onClick={() => { setCode(DEFAULT_CODE[language]); setOutput(''); setError(''); }} title="Reset code" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, gap: 5, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <RotateCcw size={13} />
          Reset
        </button>

        {/* Format */}
        <button onClick={() => editorRef.current?.format()} title="Format / indent code" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, gap: 5, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
          Fmt
        </button>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} title="Save to database" style={{ background: saving ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, padding: '7px 16px', cursor: saving ? 'not-allowed' : 'pointer', color: '#00d4ff', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
          onMouseEnter={e => !saving && (e.currentTarget.style.background = 'rgba(0,212,255,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = saving ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.15)')}
        >
          {saved ? <><Check size={13} /> Saved!</> : saving ? 'Saving...' : <><Save size={13} /> Save</>}
        </button>

        {/* Export — label changes based on mode */}
        <button onClick={exportFile} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, color: '#a855f7', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.15)'}
        >
          <Download size={13} />
          {mode === 'code' ? `Export ${LANGUAGES.find(l => l.id === language)?.ext || '.js'} File` : mode === 'notes' ? 'Export .txt' : 'Export HTML'}
        </button>

        {/* Profile Icon + Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(p => !p)}
            title="Profile"
            style={{ background: 'linear-gradient(135deg, #00d4ff22, #a855f722)', border: '1px solid var(--border)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.color = '#a855f7'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || <User size={15} />}
          </button>

          {/* Profile Card Dropdown */}
          {profileOpen && (
            <>
              {/* Backdrop */}
              <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setProfileOpen(false)} />
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 0, width: 300, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                {/* Card top gradient banner */}
                <div style={{ height: 6, background: 'linear-gradient(90deg, #00d4ff, #a855f7)' }} />

                <div style={{ padding: '20px 20px 18px' }}>
                  {/* Close button */}
                  <button onClick={() => setProfileOpen(false)} style={{ position: 'absolute', top: 16, right: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 5, borderRadius: 7, transition: 'all 0.15s', zIndex: 1 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = '#a855f7'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  ><X size={13} /></button>

                  {/* Avatar + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', flexShrink: 0, boxShadow: '0 4px 16px rgba(168,85,247,0.35)' }}>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.name || 'User'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', minWidth: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }} title={user?.email || ''}>
                          {user?.email || ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

                  {/* Logout button */}
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, color: '#ef4444', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 700, transition: 'all 0.15s', letterSpacing: '0.02em' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <LogOut size={14} />
                    LogOut
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ─── Main Body ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 6, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
          {MODES.map(m => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)} title={m.label} style={{ width: 36, height: 36, borderRadius: 8, cursor: 'pointer', border: 'none', background: active ? 'rgba(168,85,247,0.2)' : 'transparent', color: active ? '#a855f7' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
              ><Icon size={17} /></button>
            );
          })}
          <div style={{ height: 1, width: 28, background: 'var(--border)', margin: '4px 0' }} />
          <button
            onClick={async () => {
              try {
                const [codeRes, notesRes] = await Promise.all([api.get('/code'), api.get('/notes')]);
                setSavedFiles({ code: codeRes.data || [], notes: notesRes.data || [] });
              } catch { setSavedFiles({ code: [], notes: [] }); }
              setShowSaved(true);
            }}
            title="Open saved files"
            style={{ width: 36, height: 36, borderRadius: 8, cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = '#00d4ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          ><FolderOpen size={17} /></button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Notes Panel */}
          {(mode === 'workspace' || mode === 'notes') && (
            <>
              <div style={{ width: mode === 'notes' ? '100%' : `${splitPos}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
                <NotesPanel ref={notesPanelRef} />
              </div>
              {mode === 'workspace' && (
                <div className="resize-handle" onMouseDown={startHResize} />
              )}
            </>
          )}

          {/* Code + Output Panel */}
          {(mode === 'workspace' || mode === 'code') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* File Tabs */}
              <div style={{ height: 40, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0, paddingLeft: 8, gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  {tabs.map(tab => {
                    const lang = LANGUAGES.find(l => l.id === tab.lang);
                    const displayName = getTabDisplayName(tab);
                    const isActive   = activeTab === tab.id;
                    const isRenaming = renamingTab === tab.id;

                    return (
                      <div key={tab.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px 0 12px', height: '100%', cursor: 'pointer', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', borderBottom: isActive ? '2px solid #a855f7' : '2px solid transparent', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', background: isActive ? 'var(--bg-primary)' : 'transparent', borderRight: '1px solid var(--border)', transition: 'all 0.15s', userSelect: 'none' }}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: lang?.color, flexShrink: 0 }} />

                        {isRenaming ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingTab(null); }}
                              onClick={e => e.stopPropagation()}
                              style={{ background: 'var(--bg-elevated)', border: '1px solid #a855f7', borderRadius: 4, padding: '1px 5px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, outline: 'none', width: Math.max(50, renameValue.length * 8) }}
                            />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{lang?.ext}</span>
                          </div>
                        ) : (
                          <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                        )}

                        {isActive && !isRenaming && (
                          <button
                            onClick={e => startRename(tab.id, tab.fileName || lang?.defaultName || 'script', e)}
                            title="Rename file"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0 1px', opacity: 0.7, transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                          ><Edit2 size={10} /></button>
                        )}

                        {tabs.length > 1 && (
                          <button onClick={e => { e.stopPropagation(); const remaining = tabs.filter(t => t.id !== tab.id); setTabs(remaining); if (activeTab === tab.id) setActiveTab(remaining[0].id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex', marginLeft: 1 }}>
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => { const id = Date.now(); const langCfg = LANGUAGES.find(l => l.id === language) || LANGUAGES[0]; setTabs(p => [...p, { id, lang: language, fileName: langCfg.defaultName }]); setActiveTab(id); setCode(DEFAULT_CODE[language]); setSnippetIds(prev => { const n = {...prev}; delete n[id]; return n; }); }} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                ><Plus size={14} /></button>
              </div>

              {/* Editor + Console */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ height: `${editorSplit}%`, overflow: 'hidden', flexShrink: 0 }}>
                  <CodeEditor ref={editorRef} code={code} language={language} onChange={setCode} isDark={isDark} />
                </div>
                <div style={{ height: 5, background: 'var(--border)', cursor: 'row-resize', flexShrink: 0, transition: 'background 0.2s' }}
                  onMouseDown={startVResize}
                  onMouseEnter={e => e.currentTarget.style.background = '#a855f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <OutputConsole output={output} error={error} loading={running} onClear={() => { setOutput(''); setError(''); }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {langMenuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setLangMenuOpen(false)} />}

      {/* Global Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, padding: '10px 22px',
          background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
          color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600,
          fontFamily: 'Space Grotesk, sans-serif',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeInUp 0.25s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.type === 'error' ? '⚠' : '✓'} {toast.msg}
        </div>
      )}

      {/* ── Open Saved Files Modal ── */}
      {showSaved && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300 }} onClick={() => setShowSaved(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, width: 560, maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FolderOpen size={16} style={{ color: '#00d4ff' }} />
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Open Saved Files</span>
              </div>
              <button onClick={() => setShowSaved(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6 }}><X size={15} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Code Snippets */}
              <div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Code Files ({savedFiles.code.length})</div>
                {savedFiles.code.length === 0
                  ? <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No saved code files yet.</p>
                  : savedFiles.code.map(s => (
                    <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', marginBottom: 6, background: 'var(--bg-elevated)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#00d4ff'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      onClick={() => {
                        const newId   = Date.now();
                        const stem    = s.title.replace(/\.[^.]+$/, '');
                        setTabs(prev => [...prev, { id: newId, lang: s.language, fileName: stem }]);
                        setActiveTab(newId);
                        setCode(s.code);
                        setLanguage(s.language);
                        setOutput(s.output || '');
                        setSnippetIds(prev => ({ ...prev, [newId]: s._id }));
                        setShowSaved(false);
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: LANGUAGES.find(l => l.id === s.language)?.color || '#888', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{LANGUAGES.find(l => l.id === s.language)?.label} · {new Date(s.updatedAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={async e => {
                        e.stopPropagation();
                        await api.delete(`/code/${s._id}`);
                        setSavedFiles(prev => ({ ...prev, code: prev.code.filter(c => c._id !== s._id) }));
                        setSnippetIds(prev => { const next = { ...prev }; Object.keys(next).forEach(k => { if (next[k] === s._id) delete next[k]; }); return next; });
                        showToast('Code file deleted');
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 5, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      ><Trash2 size={13} /></button>
                    </div>
                  ))
                }
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Notes ({savedFiles.notes.length})</div>
                {savedFiles.notes.length === 0
                  ? <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No saved notes yet.</p>
                  : savedFiles.notes.map(n => (
                    <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', marginBottom: 6, background: 'var(--bg-elevated)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#a855f7'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      onClick={() => {
                        if (notesPanelRef.current?.openNote) notesPanelRef.current.openNote(n);
                        if (mode === 'code') setMode('workspace');
                        setShowSaved(false);
                      }}
                    >
                      <FileText size={14} style={{ color: '#a855f7', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.content.length} chars · {new Date(n.updatedAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={async e => {
                        e.stopPropagation();
                        await api.delete(`/notes/${n._id}`);
                        setSavedFiles(prev => ({ ...prev, notes: prev.notes.filter(x => x._id !== n._id) }));
                        showToast('Note deleted');
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 5, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      ><Trash2 size={13} /></button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
