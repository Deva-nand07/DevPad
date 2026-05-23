import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

export default function CodingTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => { setRunning(false); setSeconds(0); };

  const fmt = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px' }}>
      <Timer size={13} style={{ color: 'var(--text-muted)' }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: running ? '#00d4ff' : 'var(--text-secondary)', minWidth: 48 }}>
        {fmt(seconds)}
      </span>
      <button onClick={() => setRunning(p => !p)} title={running ? 'Pause' : 'Start'} style={{
        background: running ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
        border: `1px solid ${running ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
        borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: running ? '#ef4444' : '#10b981', transition: 'all 0.2s',
      }}>
        {running ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <button onClick={reset} title="Reset" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      ><RotateCcw size={12} /></button>
    </div>
  );
}
