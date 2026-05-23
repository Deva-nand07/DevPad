import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Terminal, Code2, FileText, Lock, Play, Download, Timer, Save, Zap } from 'lucide-react';

const SECTIONS = [
  {
    id: 'getting-started', label: 'Getting Started', icon: Play,
    content: {
      title: 'Getting Started with DevPad',
      items: [
        { heading: '1. Register an Account', text: 'Click "Start Coding" on the landing page. Fill in your name, email, and a password (minimum 6 characters). Passwords are hashed with bcrypt — never stored in plain text.' },
        { heading: '2. Login', text: 'Enter your registered email and password. If you enter incorrect credentials, a red shake-animated error banner appears and stays visible until you start typing to correct your input. Your fields are kept intact so you only retype what is wrong.' },
        { heading: '3. Session & Auto-Logout', text: 'Your session token is stored in sessionStorage, not localStorage. This means closing the browser tab ends your session automatically — re-open DevPad and log in again to continue. This is intentional for security.' },
        { heading: '4. Your Workspace', text: 'After login you land on the main workspace: the Notes panel on the left, the code editor on the right, and the output console at the bottom. Use the left sidebar icons to switch between Workspace, Notes Only, and Code Only views.' },
      ]
    }
  },
  {
    id: 'editor', label: 'Code Editor', icon: Code2,
    content: {
      title: 'Using the Code Editor',
      items: [
        { heading: 'Supported Languages', text: 'DevPad supports JavaScript (Node 18), Python 3, C++ (GCC), and Java. Select your language from the dropdown in the navbar. The editor loads a starter template for each language automatically.' },
        { heading: 'Writing Code', text: 'The editor is powered by CodeMirror 6 with syntax highlighting, line numbers, and bracket matching. Press Tab to indent. The editor does not auto-format as you type — formatting is on-demand only.' },
        { heading: 'Formatting Code', text: 'Click the "Fmt" button in the toolbar to format your code on demand. For C-style languages (JS, Java, C++) it normalises indentation using brace matching. For Python it snaps lines to 4-space levels. Formatting never fires automatically.' },
        { heading: 'Running Code', text: 'Click the green "Run" button to execute your code via Judge0. Output appears in the Output tab below the editor. Compile errors and stderr appear in the Errors tab. You can also click the external-link icon to open the output in a full new browser tab.' },
        { heading: 'Multiple Tabs', text: 'Use the "+" on the tab bar to open additional code tabs. Double-click any tab to rename it. The tab filename (e.g. main.cpp, Solution.java) is used as the key when saving to the database.' },
      ]
    }
  },
  {
    id: 'saving', label: 'Saving & Storage', icon: Save,
    content: {
      title: 'Saving Code & Notes',
      items: [
        { heading: 'How the Save Button Works', text: 'Click the "Save" button in the top navbar to persist your work. The save is context-aware: in Workspace mode it saves both your current code tab and your current note. In Code Only mode it saves only the code. In Notes Only mode it saves only the note.' },
        { heading: 'Smart Upsert (No Duplicates)', text: 'DevPad checks the database before saving. If a file with the same name and language already exists (e.g. script.js in JavaScript), it updates that record. If it does not exist, it creates a new one. You will never end up with duplicate copies of the same file.' },
        { heading: 'Code Save Keys', text: 'Code records are identified by the tab filename + language. If you rename a tab to main.cpp and switch to C++, Save will look for an existing main.cpp C++ record. Renaming the tab essentially creates a new save slot.' },
        { heading: 'Notes — Manual Save Only', text: 'Notes are never auto-saved. Click the "+" in the Notes panel to open a new draft (shown with a purple dot in the panel header). Write your note, then click the Save button to persist it to MongoDB. The dot turns yellow when you edit an already-saved note.' },
        { heading: 'Loading on Login', text: 'When you log in and open the workspace, DevPad automatically loads your most recently saved code snippet and restores the language selection. Your notes list is also loaded from the database.' },
      ]
    }
  },
  {
    id: 'notes', label: 'Notes Panel', icon: FileText,
    content: {
      title: 'Notes Panel',
      items: [
        { heading: 'Creating a Note', text: 'Click the "+" button in the Notes panel header. This opens a local draft immediately — no database call is made yet. A purple dot appears in the header indicating an unsaved draft. Give it a title and write your content, then click Save in the toolbar to persist it.' },
        { heading: 'Editing Saved Notes', text: 'Click any note tab to load it into the editor. Once you start typing, a yellow dot appears in the panel header indicating unsaved changes. Click Save to update the note in MongoDB.' },
        { heading: 'Multiple Notes', text: 'You can have as many notes as you want. Switch between them using the tab strip above the editor area. Delete a note by clicking the trash icon on its tab — this immediately removes it from the database.' },
        { heading: 'Notes in Workspace Mode', text: 'When in Workspace mode, the Save button saves both your active note and your active code file in one click. In Notes Only mode, Save only saves the current note.' },
      ]
    }
  },
  {
    id: 'execution', label: 'Code Execution', icon: Terminal,
    content: {
      title: 'Code Execution (Judge0 CE)',
      items: [
        { heading: 'How It Works', text: 'DevPad routes your code to Judge0 CE (Community Edition) — a free, open-source sandboxed execution API. Requests go: React frontend → Express 5 backend (/api/execute) → Judge0 CE. No API key is required for the public instance.' },
        { heading: 'Supported Languages & IDs', text: 'JavaScript Node.js 18 (Judge0 ID 93), Python 3.8 (ID 71), C++ GCC 9.2.0 (ID 54), Java OpenJDK 13 (ID 62). The language dropdown in the navbar switches both the editor syntax and the execution engine.' },
        { heading: 'Output & Errors', text: 'After running, stdout appears in the Output tab in green. Compiler errors and stderr appear in the Errors tab in red. A "!" badge signals error content. Click the external-link icon to open output in a full-screen new tab.' },
        { heading: 'Supported Programs', text: 'Judge0 CE supports full programs including OOP (classes, inheritance), DSA (trees, graphs, sorting, dynamic programming), and standard library usage. Programs must fit in a single file. No file I/O or external network calls from within the sandbox.' },
        { heading: 'Rate Limits', text: 'The public Judge0 CE instance allows roughly 50–100 executions per day on shared infrastructure. Each run has a 5-second CPU time limit and 256 MB memory cap. For unlimited executions, self-host Judge0 CE via Docker or use a paid RapidAPI key.' },
      ]
    }
  },
  {
    id: 'auth', label: 'Authentication', icon: Lock,
    content: {
      title: 'Authentication & Security',
      items: [
        { heading: 'Session Storage', text: 'JWT tokens are stored in sessionStorage, not localStorage. Closing the browser tab clears the token and you are logged out automatically. This prevents stale login sessions.' },
        { heading: 'Password Security', text: 'Passwords are never stored in plain text. bcryptjs hashes your password with 12 salt rounds before saving to MongoDB.' },
        { heading: 'Login Error UX', text: 'When you enter wrong credentials, a shake-animated red banner appears and stays on screen. It only clears when you start typing in either field — not after a timeout. Fields are kept intact so you only correct what is wrong.' },
        { heading: 'Profile Card', text: 'Click the avatar button (your initials) in the top-right corner to open your profile card. It shows your name, email, and a Sign Out button.' },
        { heading: 'Data Isolation', text: 'All notes and code snippets are tagged with your userId. You can only ever see and access your own data — other users data is never visible.' },
      ]
    }
  },
  {
    id: 'export', label: 'Export & Tools', icon: Download,
    content: {
      title: 'Export & Tools',
      items: [
        { heading: 'Export HTML (Workspace)', text: 'In Workspace mode, "Export HTML" downloads a fully self-contained HTML snapshot of your workspace. Code is syntax-highlighted using Prism.js (same colour theme as the editor), notes are rendered with formatting, and the output console is included.' },
        { heading: 'Export Source File (Code Mode)', text: 'In Code Only mode, the Export button downloads the raw source file with the correct extension (e.g. main.py, Solution.java, script.js). Ready to run locally.' },
        { heading: 'Export Notes (Notes Mode)', text: 'In Notes Only mode, the Export button downloads your current note as a .txt file.' },
        { heading: 'Dark / Light Mode', text: 'Toggle between dark and light mode using the sun/moon icon in the navbar. The landing page is always dark. The workspace respects your toggle.' },
        { heading: 'Coding Timer', text: 'The timer in the navbar counts elapsed time since the page loaded. Use it to track how long you have been working on a problem or session.' },
        { heading: 'Panel Resizing', text: 'Drag the vertical divider between the notes panel and the code editor to resize them. Drag the horizontal divider between the editor and the output console to control output height.' },
      ]
    }
  },
  {
    id: 'tips', label: 'Tips & Shortcuts', icon: Zap,
    content: {
      title: 'Tips & Keyboard Shortcuts',
      items: [
        { heading: 'Save Shortcut', text: 'Click Save after writing both code and notes — one click saves everything visible in your current mode. In Workspace mode this saves both the active note and the active code tab together.' },
        { heading: 'Tab Renaming', text: 'Double-click any tab name to rename it. The filename you set becomes the database key for that code file — rename to switch between save slots (e.g. brute.cpp vs optimised.cpp).' },
        { heading: 'Note Drafts', text: 'You can have one unsaved draft open at a time. Clicking Save converts it into a permanent DB record. Switching to another note discards the draft — click Save first if you want to keep it.' },
        { heading: 'Reset Code', text: 'The circular arrow (↺) button next to Run resets the editor to the default starter template for the current language. This cannot be undone.' },
        { heading: 'Format Before Save', text: 'A good habit is to click Fmt → Run → Save in that order. Format first, verify the output, then persist.' },
        { heading: 'stdin Input', text: 'Judge0 supports stdin. For programs that read user input (e.g. Scanner in Java, input() in Python), the execution sandbox pre-fills stdin — but DevPad does not currently expose a stdin input field. Plan your programs to use hardcoded test values.' },
      ]
    }
  },
];

export default function DocsPage() {
  const navigate  = useNavigate();
  const [active, setActive] = useState('getting-started');
  const section   = SECTIONS.find(s => s.id === active);
  const content   = section?.content;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', fontFamily: 'Space Grotesk, sans-serif', color: '#e8e8f0' }}>

      {/* Navbar — same style as AboutPage */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 48px', borderBottom:'1px solid #1e1e35', flexShrink: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => navigate('/')}>
          <img src="/devpad_logo.png" alt="DevPad" style={{ width:32, height:32, borderRadius:8, objectFit:'cover' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>Dev<span style={{ background:'linear-gradient(135deg,#00d4ff,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Pad</span></span>
        </div>
        <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'1px solid #1e1e35', borderRadius:8, padding:'8px 16px', color:'#8888aa', cursor:'pointer', fontFamily:'Space Grotesk,sans-serif', fontSize:14, transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#a855f7'; e.currentTarget.style.color='#e8e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#1e1e35'; e.currentTarget.style.color='#8888aa'; }}
        ><ArrowLeft size={14}/> Back</button>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: 220, borderRight: '1px solid #1e1e35', background: '#0d0d1a', padding: '20px 0', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '0 16px 12px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#555577', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contents</div>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: isActive ? 'rgba(168,85,247,0.12)' : 'none', border: 'none', borderLeft: `2px solid ${isActive ? '#a855f7' : 'transparent'}`, cursor: 'pointer', color: isActive ? '#a855f7' : '#8888aa', fontSize: 13, fontWeight: isActive ? 700 : 500, textAlign: 'left', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e8e8f0'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#8888aa'; } }}
              >
                <Icon size={14} />
                {s.label}
                {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', maxWidth: 780 }}>
          {content && (
            <>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#fff', marginBottom: 32 }}>{content.title}</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {content.items.map((item, i) => (
                  <div key={i} style={{ borderLeft: '2px solid #1e1e35', paddingLeft: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: '#e8e8f0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#a855f7)', display: 'inline-block', flexShrink: 0 }} />
                      {item.heading}
                    </h3>
                    <p style={{ fontSize: 14, color: '#8888aa', lineHeight: 1.75 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
