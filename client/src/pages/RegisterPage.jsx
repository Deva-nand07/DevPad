import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Mail, Lock, User, Sun, Moon } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name || !email || !password) return setError('All fields are required');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      await register(name, email, password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirm, register, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-header">
        <Link to="/" className="auth-logo">
          <img src="/devpad_logo.png" alt="DevPad" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          <span className="auth-logo-text">Dev<span className="gradient-text">Pad</span></span>
        </Link>
        <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="auth-card">
        <div className="auth-card-header">
          <h1>Create Account</h1>
          <p>Join DevPad and start coding</p>
          <div className="auth-divider">
            <div className="auth-divider-line left" />
            <span className="auth-divider-icon">&lt;/&gt;</span>
            <div className="auth-divider-line right" />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="field-group">
          <label>Name</label>
          <div className="input-wrap">
            <User size={15} className="input-icon" />
            <input type="text" placeholder="Your full name" value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="auth-input" autoComplete="name" />
          </div>
        </div>

        <div className="field-group">
          <label>Email</label>
          <div className="input-wrap">
            <Mail size={15} className="input-icon" />
            <input type="email" placeholder="Enter your email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="auth-input" autoComplete="email" />
          </div>
        </div>

        <div className="field-group">
          <label>Password</label>
          <div className="input-wrap">
            <Lock size={15} className="input-icon" />
            <input type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="auth-input with-right" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPass(p => !p)} className="eye-btn">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="field-group">
          <label>Confirm Password</label>
          <div className="input-wrap">
            <Lock size={15} className="input-icon" />
            <input type="password" placeholder="Confirm your password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="auth-input" autoComplete="new-password" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="auth-btn" style={{ marginTop: 8 }}>
          {loading ? <><div className="spinner" /> Creating account...</> : 'Create Account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>

        <div className="auth-tagline">
          <span className="c1">{'>'} </span>
          <span className="c2">code</span><span className="cm">. </span>
          <span className="c3">note</span><span className="cm">. </span>
          <span className="c4">focus</span><span className="cm">. </span>
          <span className="c5">create</span><span className="cm">.</span>
        </div>
      </div>

      <style>{`
        .auth-page { min-height:100vh; background:var(--bg-primary); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; position:relative; }
        .auth-header { position:absolute; top:0; left:0; right:0; display:flex; align-items:center; justify-content:space-between; padding:20px 32px; }
        .auth-logo { display:flex; align-items:center; gap:8px; text-decoration:none; }
        .auth-logo-text { font-family:'Syne',sans-serif; font-weight:800; font-size:18px; color:var(--text-primary); }
        .icon-btn { background:var(--bg-elevated); border:1px solid var(--border); border-radius:50%; width:40px; height:40px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); transition:all 0.2s; }
        .icon-btn:hover { border-color:#a855f7; color:#a855f7; }
        .auth-card { width:100%; max-width:420px; background:var(--bg-card); border:1px solid var(--border); border-radius:20px; padding:40px; box-shadow:0 40px 100px rgba(0,0,0,0.5); animation:fadeInUp 0.5s ease; }
        .auth-card-header { text-align:center; margin-bottom:28px; }
        .auth-card-header h1 { font-family:'Syne',sans-serif; font-weight:800; font-size:28px; color:var(--text-primary); margin-bottom:8px; }
        .auth-card-header p { color:var(--text-secondary); font-size:14px; }
        .auth-divider { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:20px; }
        .auth-divider-line { height:1px; width:80px; }
        .auth-divider-line.left { background:linear-gradient(to right,transparent,#00d4ff); }
        .auth-divider-line.right { background:linear-gradient(to left,transparent,#a855f7); }
        .auth-divider-icon { font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--text-muted); }
        .auth-error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:10px 14px; margin-bottom:16px; color:#ef4444; font-size:13px; }
        .field-group { margin-bottom:18px; }
        .field-group label { display:block; margin-bottom:8px; font-size:13px; font-weight:600; color:var(--text-secondary); }
        .input-wrap { position:relative; }
        .input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
        .auth-input { width:100%; padding:12px 16px 12px 44px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; color:var(--text-primary); font-family:'Space Grotesk',sans-serif; font-size:14px; outline:none; transition:border-color 0.2s; }
        .auth-input.with-right { padding-right:44px; }
        .auth-input:focus { border-color:#a855f7; }
        .eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; }
        .eye-btn:hover { color:var(--text-primary); }
        .auth-btn { width:100%; padding:13px; background:linear-gradient(135deg,#00d4ff,#a855f7); border:none; border-radius:10px; color:#0a0a0f; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:15px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .auth-btn:not(:disabled):hover { transform:translateY(-1px); box-shadow:0 8px 30px rgba(168,85,247,0.4); }
        .spinner { width:16px; height:16px; border:2px solid #0a0a0f; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; }
        .auth-switch { text-align:center; margin-top:20px; font-size:14px; color:var(--text-secondary); }
        .auth-switch a { color:#a855f7; text-decoration:none; font-weight:600; }
        .auth-tagline { text-align:center; margin-top:24px; font-family:'JetBrains Mono',monospace; font-size:11px; }
        .c1{color:#00d4ff;} .c2{color:var(--text-secondary);} .c3{color:#a855f7;} .c4{color:#f59e0b;} .c5{color:#10b981;} .cm{color:var(--text-muted);}
        .gradient-text { background:linear-gradient(135deg,#00d4ff,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
      `}</style>
    </div>
  );
}
