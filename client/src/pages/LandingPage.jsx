import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, FileText, Timer, Zap, Shield, Globe, ArrowRight } from 'lucide-react';

// Force dark mode on landing page regardless of user preference
function useForceDark() {
  useEffect(() => {
    document.body.classList.remove('light-mode');
    return () => {
      // restore on unmount based on saved preference
      const saved = localStorage.getItem('devpad_theme');
      if (saved === 'light') document.body.classList.add('light-mode');
    };
  }, []);
}

function useTypewriter(text, speed = 30, delay = 0, repeatInterval = 0) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      let i = 0;
      setDisplayed('');
      setDone(false);
      const timeout = setTimeout(() => {
        const interval = setInterval(() => {
          if (cancelled) { clearInterval(interval); return; }
          if (i < text.length) {
            setDisplayed(text.slice(0, ++i));
          } else {
            clearInterval(interval);
            setDone(true);
            if (repeatInterval > 0) {
              setTimeout(() => { if (!cancelled) run(); }, repeatInterval);
            }
          }
        }, speed);
      }, delay);
      return timeout;
    };

    const t = run();
    return () => { cancelled = true; clearTimeout(t); };
  }, [text, speed, delay, repeatInterval]);

  return { displayed, done };
}

const FEATURES = [
  { icon: Code2, title: 'Multi-Language Editor', desc: 'Syntax-highlighted editor for JavaScript, Python, C++, and Java with line numbers and autocomplete.', color: '#00d4ff' },
  { icon: Zap, title: 'Live Code Execution', desc: 'Run your code instantly via Judge0 CE and see output in the integrated console.', color: '#a855f7' },
  { icon: FileText, title: 'Smart Notes Panel', desc: 'Keep study notes beside your code. Manually save to MongoDB whenever you\'re ready — full control, no surprises.', color: '#10b981' },
  { icon: Timer, title: 'Focus Timer', desc: 'Built-in coding timer with pause/reset to track your sessions and stay productive.', color: '#f59e0b' },
  { icon: Shield, title: 'Secure & Private', desc: 'JWT authentication with bcrypt hashing keeps your workspace fully private.', color: '#ef4444' },
  { icon: Globe, title: 'Export & Save', desc: 'Export code as HTML for sharing. Save snippets to your personal library.', color: '#3b82f6' },
];

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2.5 + 1, dur: Math.random() * 8 + 5, delay: Math.random() * 6,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.id % 2 === 0 ? '#00d4ff' : '#a855f7', opacity: 0.25,
          animation: `lp-float ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

export default function LandingPage() {
  useForceDark();
  const navigate = useNavigate();
  const descText = "Your all-in-one workspace for coding, note-taking, and building ideas with complete focus. Designed for developers. Built for productivity.";
  const { displayed, done } = useTypewriter(descText, 25, 1000, 10000);
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef(null);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 48px',
        background: scrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(30,30,53,0.8)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/devpad_logo.png" alt="DevPad" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff' }}>
            Dev<span style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pad</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[
            { label: 'Features', action: () => featuresRef.current?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'About', action: () => navigate('/about') },
            { label: 'Docs', action: () => navigate('/docs') },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              background: 'none', border: 'none', color: '#8888aa',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, cursor: 'pointer',
              padding: '8px 16px', borderRadius: 8, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = '#e8e8f0'}
            onMouseLeave={e => e.target.style.color = '#8888aa'}
            >{item.label}</button>
          ))}
          <button onClick={() => navigate('/login')} style={{
            background: 'transparent', border: '1px solid rgba(168,85,247,0.5)',
            color: '#e8e8f0', fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 14, fontWeight: 600, padding: '9px 22px', borderRadius: 8, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; e.currentTarget.style.borderColor = '#a855f7'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'; }}
          >Login</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(10,10,50,0.8) 0%, #0a0a0f 70%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(0,212,255,0.07) 0%, rgba(168,85,247,0.05) 40%, transparent 70%)' }} />
        {/* Neon arc */}
        <svg style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '88%', height: 200, zIndex: 0 }} viewBox="0 0 1000 200" preserveAspectRatio="none">
          <path d="M 0 180 Q 500 20 1000 180" fill="none" stroke="url(#arcG)" strokeWidth="1.5" />
          <defs>
            <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
        <Particles />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 820 }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ animation: 'lp-float 5s ease-in-out infinite' }}>
              <img src="/devpad_logo.png" alt="DevPad Logo"
                style={{ width: 110, height: 110, borderRadius: 28, objectFit: 'cover', boxShadow: '0 0 60px rgba(168,85,247,0.4), 0 0 120px rgba(0,212,255,0.15)' }}
              />
            </div>
          </div>

          {/* Title */}
          <div style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            marginBottom: 16,
          }}>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(72px, 14vw, 140px)',
              fontWeight: 800, letterSpacing: '-4px', lineHeight: 1,
            }}>
              <span style={{ color: '#fff' }}>Dev</span>
              <span style={{
                background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.4))',
              }}>Pad</span>
            </span>
          </div>

          {/* Tagline */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
            {[['CODE.','#00d4ff'],['NOTE.','#a855f7'],['FOCUS.','#f59e0b'],['CREATE.','#10b981']].map(([word, color], i) => (
              <span key={word} style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(12px,2vw,16px)',
                fontWeight: 600, color, letterSpacing: '3px',
                opacity: 0, animation: 'lp-fade 0.4s ease forwards',
                animationDelay: `${0.9 + i * 0.15}s`,
              }}>{word}</span>
            ))}
          </div>

          {/* Description typewriter */}
          <div style={{ color: '#8888aa', fontSize: 17, lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px', minHeight: 84, fontFamily: 'Space Grotesk, sans-serif' }}>
            {displayed}
            {!done && <span style={{ borderRight: '2px solid #00d4ff', marginLeft: 2, animation: 'lp-blink 1s step-end infinite' }}>&nbsp;</span>}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)', border: 'none', color: '#0a0a0f',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16,
              padding: '14px 36px', borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(168,85,247,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 16px 50px rgba(168,85,247,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(168,85,247,0.3)'; }}
            >Start Using <ArrowRight size={18} /></button>
            <button onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#e8e8f0',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16,
              padding: '14px 36px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,212,255,0.4)'; e.currentTarget.style.background='rgba(0,212,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; e.currentTarget.style.background='transparent'; }}
            >View Features</button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div ref={featuresRef} style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00d4ff', fontSize: 12, letterSpacing: 3, marginBottom: 16 }}>// FEATURES</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: '#fff' }}>
            Everything you need,<br />
            <span style={{ background: 'linear-gradient(135deg,#00d4ff,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>in one place.</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{
                background: '#13131f', border: '1px solid #1e1e35', borderRadius: 16, padding: 28,
                transition: 'all 0.3s ease', cursor: 'default',
                opacity: 0, animation: 'lp-fadeUp 0.6s ease forwards', animationDelay: `${i * 0.1}s`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=f.color+'55'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 20px 50px ${f.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#1e1e35'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ width:48,height:48,borderRadius:12,background:f.color+'1a',border:`1px solid ${f.color}33`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
                  <Icon size={22} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontWeight:700,fontSize:17,color:'#e8e8f0',marginBottom:8 }}>{f.title}</h3>
                <p style={{ color:'#8888aa',fontSize:14,lineHeight:1.6 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e1e35', padding: '28px 48px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#444466' }}>
          <span style={{ color: '#00d4ff' }}>{'>'}</span>{' '}
          <span style={{ color: '#8888aa' }}>code</span><span style={{ color: '#444466' }}>. </span>
          <span style={{ color: '#a855f7' }}>note</span><span style={{ color: '#444466' }}>. </span>
          <span style={{ color: '#f59e0b' }}>focus</span><span style={{ color: '#444466' }}>. </span>
          <span style={{ color: '#10b981' }}>create</span>
          <span style={{ color: '#444466' }}>() — DevPad © 2025 by Deva Nand</span>
        </div>
      </footer>

      <style>{`
        @keyframes lp-float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);} }
        @keyframes lp-blink { 0%,100%{opacity:1;}50%{opacity:0;} }
        @keyframes lp-fade { from{opacity:0;}to{opacity:1;} }
        @keyframes lp-fadeUp { from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);} }
      `}</style>
    </div>
  );
}
