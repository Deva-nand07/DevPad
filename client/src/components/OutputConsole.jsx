import { useState } from 'react';
import { Terminal, AlertTriangle, Trash2, ExternalLink } from 'lucide-react';

export default function OutputConsole({ output, error, loading, onClear }) {
  const [activeTab, setActiveTab] = useState('output');

  const openInNewTab = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>DevPad Output</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; color: #e8e8f0; font-family: 'JetBrains Mono', monospace; min-height: 100vh; display: flex; flex-direction: column; }
    header { padding: 16px 24px; border-bottom: 1px solid #1e1e35; display: flex; align-items: center; gap: 12px; background: #13131f; }
    .brand { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16px; color: #e8e8f0; }
    .brand span { background: linear-gradient(135deg, #00d4ff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge { font-size: 11px; padding: 2px 10px; border-radius: 99px; border: 1px solid #1e1e35; color: #8888aa; }
    main { flex: 1; padding: 28px; }
    h2 { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: #8888aa; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    pre { background: #13131f; border: 1px solid #1e1e35; border-radius: 10px; padding: 20px; font-size: 13px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; }
    .out { color: #10b981; }
    .err { color: #ef4444; }
    .empty { color: #444466; font-style: italic; }
    section + section { margin-top: 28px; }
    footer { padding: 14px 24px; border-top: 1px solid #1e1e35; font-size: 11px; color: #444466; text-align: center; }
  </style>
</head>
<body>
  <header>
    <div class="brand">Dev<span>Pad</span></div>
    <span class="badge">Output View</span>
    <span class="badge" style="margin-left:auto">${new Date().toLocaleTimeString()}</span>
  </header>
  <main>
    <section>
      <h2><span class="dot" style="background:#10b981"></span>Standard Output</h2>
      <pre class="${output ? 'out' : 'empty'}">${output ? output.replace(/</g,'&lt;').replace(/>/g,'&gt;') : 'No output yet. Run your code first.'}</pre>
    </section>
    <section>
      <h2><span class="dot" style="background:#ef4444"></span>Errors</h2>
      <pre class="${error ? 'err' : 'empty'}">${error ? error.replace(/</g,'&lt;').replace(/>/g,'&gt;') : 'No errors ✓'}</pre>
    </section>
  </main>
  <footer>DevPad — Code. Note. Focus. Create.</footer>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Clean up after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const tabStyle = (active) => ({
    padding: '6px 16px', background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? '#a855f7' : 'transparent'}`,
    color: active ? '#a855f7' : 'var(--text-muted)',
    fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary)' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0, paddingLeft: 8 }}>
        <div style={{ display: 'flex' }}>
          <button style={tabStyle(activeTab === 'output')} onClick={() => setActiveTab('output')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Terminal size={12} />Output</span>
          </button>
          <button style={tabStyle(activeTab === 'errors')} onClick={() => setActiveTab('errors')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} />
              Errors
              {error && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '0 5px', borderRadius: 10 }}>!</span>}
            </span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, paddingRight: 8 }}>
          <button
            onClick={onClear}
            title="Clear output"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          ><Trash2 size={14} /></button>

          <button
            onClick={openInNewTab}
            title="Open output in new tab"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00d4ff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          ><ExternalLink size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 16, overflow: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.7 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#00d4ff' }}>
            <div style={{ width: 14, height: 14, border: '2px solid rgba(0,212,255,0.3)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>Executing code...</span>
          </div>
        ) : activeTab === 'output' ? (
          output ? (
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 11 }}>{'>'} execution output</div>
              <pre style={{ color: '#10b981', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{output}</pre>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Process exited</span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: '#00d4ff' }}>{'>'} </span>
              Run your code to see output here
              <div style={{ marginTop: 8, display: 'inline-block', width: 8, height: 14, background: 'var(--text-muted)', opacity: 0.5, animation: 'blink 1s step-end infinite', marginLeft: 2 }} />
            </div>
          )
        ) : (
          error ? (
            <pre style={{ color: '#ef4444', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{error}</pre>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No errors detected ✓</span>
          )
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }`}</style>
    </div>
  );
}
