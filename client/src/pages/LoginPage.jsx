import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Mail, Lock, Sun, Moon, X } from 'lucide-react';
import api from '../api/axios';

export default function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [showForgot, setShowForgot]       = useState(false);
  const [forgotStep, setForgotStep]       = useState(1); // 1=email, 2=otp, 3=newpass
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotOtp, setForgotOtp]         = useState('');
  const [forgotPass, setForgotPass]       = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotMsg, setForgotMsg]         = useState('');
  const [forgotError, setForgotError]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const closeForgot = () => {
    setShowForgot(false); setForgotStep(1); setForgotEmail('');
    setForgotOtp(''); setForgotPass('');
    setForgotConfirm(''); setForgotMsg(''); setForgotError('');
  };

  const handleSendOtp = async () => {
    if (!forgotEmail.trim()) { setForgotError('Please enter your email.'); return; }
    setForgotLoading(true); setForgotError(''); setForgotMsg('');
    try {
      const res = await api.post('/reset/request', { email: forgotEmail.trim() });
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'No account found with that email.');
    } finally { setForgotLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (forgotOtp.length !== 6) { setForgotError('Enter the 6-digit OTP.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      await api.post('/reset/verify-otp', { email: forgotEmail.trim(), otp: forgotOtp.trim() });
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally { setForgotLoading(false); }
  };

  const handleResetPass = async () => {
    if (!forgotPass) { setForgotError('Enter a new password.'); return; }
    if (forgotPass.length < 6) { setForgotError('Password must be at least 6 characters.'); return; }
    if (forgotPass !== forgotConfirm) { setForgotError('Passwords do not match.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      await api.post('/reset/confirm', { email: forgotEmail.trim(), otp: forgotOtp.trim(), password: forgotPass });
      setForgotMsg('Password updated! You can now log in.');
      setTimeout(closeForgot, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password.');
    } finally { setForgotLoading(false); }
  };

  const showError = (msg) => {
    setError(msg);
    setErrorKey(k => k + 1); // force remount so shake plays every time
  };

  const handleSubmit = useCallback(async () => {
    if (!email || !password) { showError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      setError('');
      navigate('/home');
    } catch (err) {
      showError('You have entered wrong Email or Password.');
    } finally {
      setLoading(false);
    }
  }, [email, password, login, navigate]);

  return (
    <div className="auth-page">
      {/* Header */}
      <div className="auth-header">
        <Link to="/" className="auth-logo">
          <img src="/devpad_logo.png" alt="DevPad" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          <span className="auth-logo-text">Dev<span className="gradient-text">Pad</span></span>
        </Link>
        <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Card */}
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>Welcome back</h1>
          <p>Sign in to continue to DevPad</p>
          <div className="auth-divider">
            <div className="auth-divider-line left" />
            <span className="auth-divider-icon">&lt;/&gt;</span>
            <div className="auth-divider-line right" />
          </div>
        </div>

        {error && (
          <div className="auth-error" key={errorKey}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="field-group">
          <label>Email</label>
          <div className="input-wrap">
            <Mail size={15} className="input-icon" />
            <input
              type="text"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="auth-input"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="field-group">
          <label>Password</label>
          <div className="input-wrap">
            <Lock size={15} className="input-icon" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="auth-input with-right"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPass(p => !p)} className="eye-btn">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="remember-row">
          <label className="remember-label">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#a855f7' }} />
            Remember me
          </label>
          <span className="forgot-link" style={{ cursor: 'pointer' }} onClick={() => setShowForgot(true)}>Forgot Password?</span>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="auth-btn">
          {loading ? <><div className="spinner" /> Signing in...</> : 'Login'}
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Sign Up now</Link>
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
        .auth-page {
          min-height: 100vh;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
        }
        .auth-header {
          position: absolute;
          top: 0; left: 0; right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 32px;
        }
        .auth-logo {
          display: flex; align-items: center; gap: 8px; text-decoration: none;
        }
        .auth-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 18px;
          color: var(--text-primary);
        }
        .icon-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 50%; width: 40px; height: 40px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); transition: all 0.2s;
        }
        .icon-btn:hover { border-color: #a855f7; color: #a855f7; }
        .auth-card {
          width: 100%; max-width: 420px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 40px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
          animation: fadeInUp 0.5s ease;
        }
        .auth-card-header { text-align: center; margin-bottom: 28px; }
        .auth-card-header h1 {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 28px;
          color: var(--text-primary); margin-bottom: 8px;
        }
        .auth-card-header p { color: var(--text-secondary); font-size: 14px; }
        .auth-divider {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; margin-top: 20px;
        }
        .auth-divider-line {
          height: 1px; width: 80px;
        }
        .auth-divider-line.left { background: linear-gradient(to right, transparent, #00d4ff); }
        .auth-divider-line.right { background: linear-gradient(to left, transparent, #a855f7); }
        .auth-divider-icon {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; color: var(--text-muted);
        }
        .auth-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.4);
          border-left: 3px solid #ef4444;
          border-radius: 8px; padding: 12px 16px;
          margin-bottom: 20px; color: #ef4444; font-size: 13px;
          font-weight: 600;
          display: flex; align-items: center; gap: 10px;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .field-group { margin-bottom: 20px; }
        .field-group label {
          display: block; margin-bottom: 8px;
          font-size: 13px; font-weight: 600;
          color: var(--text-secondary);
        }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .auth-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input.with-right { padding-right: 44px; }
        .auth-input:focus { border-color: #a855f7; }
        .eye-btn {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex;
        }
        .eye-btn:hover { color: var(--text-primary); }
        .remember-row {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 24px;
        }
        .remember-label {
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; font-size: 13px; color: var(--text-secondary);
        }
        .forgot-link { font-size: 13px; color: #a855f7; cursor: pointer; }
        .auth-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #00d4ff, #a855f7);
          border: none; border-radius: 10px;
          color: #0a0a0f;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 15px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(168,85,247,0.4);
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid #0a0a0f;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .auth-switch {
          text-align: center; margin-top: 20px;
          font-size: 14px; color: var(--text-secondary);
        }
        .auth-switch a { color: #a855f7; text-decoration: none; font-weight: 600; }
        .auth-switch a:hover { text-decoration: underline; }
        .auth-tagline {
          text-align: center; margin-top: 24px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
        }
        .c1 { color: #00d4ff; }
        .c2 { color: var(--text-secondary); }
        .c3 { color: #a855f7; }
        .c4 { color: #f59e0b; }
        .c5 { color: #10b981; }
        .cm { color: var(--text-muted); }
        .gradient-text {
          background: linear-gradient(135deg, #00d4ff, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {showForgot && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:400 }} onClick={closeForgot} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:401, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:32, width:380, boxShadow:'0 24px 60px rgba(0,0,0,0.35)' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--text-primary)', margin:0 }}>
                {forgotStep === 1 ? 'Forgot Password' : forgotStep === 2 ? 'Enter OTP' : 'New Password'}
              </h3>
              <button onClick={closeForgot} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:4 }}><X size={16}/></button>
            </div>

            {/* Step indicators */}
            <div style={{ display:'flex', gap:6, marginBottom:20 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ flex:1, height:3, borderRadius:2, background: s <= forgotStep ? 'linear-gradient(90deg,#00d4ff,#a855f7)' : 'var(--border)', transition:'all 0.3s' }} />
              ))}
            </div>

            {forgotError && <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:13, marginBottom:14 }}>⚠️ {forgotError}</div>}
            {forgotMsg   && <div style={{ padding:'10px 14px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, color:'#10b981', fontSize:13, marginBottom:14 }}>✓ {forgotMsg}</div>}

            {/* Step 1 — Email */}
            {forgotStep === 1 && (
              <>
                <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16, lineHeight:1.6 }}>Enter your registered email and we'll send a 6-digit OTP.</p>
                <div style={{ position:'relative', marginBottom:16 }}>
                  <Mail size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input type="text" placeholder="your@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    style={{ width:'100%', padding:'11px 14px 11px 36px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
                <button onClick={handleSendOtp} disabled={forgotLoading} style={{ width:'100%', padding:11, background:'linear-gradient(135deg,#00d4ff,#a855f7)', border:'none', borderRadius:8, color:'#0a0a0f', fontWeight:700, fontSize:14, cursor:forgotLoading?'not-allowed':'pointer', opacity:forgotLoading?0.7:1 }}>
                  {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </>
            )}

            {/* Step 2 — OTP */}
            {forgotStep === 2 && (
              <>
                <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12, lineHeight:1.6 }}>
                  OTP sent to <strong style={{ color:'var(--text-primary)' }}>{forgotEmail}</strong>. Check your inbox.
                </p>
                <input type="text" placeholder="Enter 6-digit OTP" maxLength={6} value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g,''))} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  style={{ width:'100%', padding:'12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'#a855f7', fontSize:22, fontFamily:'monospace', fontWeight:900, letterSpacing:10, outline:'none', boxSizing:'border-box', textAlign:'center', marginBottom:16 }} />
                <button onClick={handleVerifyOtp} disabled={forgotLoading} style={{ width:'100%', padding:11, background:'linear-gradient(135deg,#00d4ff,#a855f7)', border:'none', borderRadius:8, color:'#0a0a0f', fontWeight:700, fontSize:14, cursor:forgotLoading?'not-allowed':'pointer', opacity:forgotLoading?0.7:1 }}>
                  {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button onClick={() => { setForgotStep(1); setForgotOtp(''); setForgotError(''); }} style={{ width:'100%', marginTop:8, padding:'9px', background:'none', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>← Back</button>
              </>
            )}

            {/* Step 3 — New password */}
            {forgotStep === 3 && (
              <>
                <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16, lineHeight:1.6 }}>OTP verified ✓ Set your new password.</p>
                <input type="password" placeholder="New password (min 6 chars)" value={forgotPass} onChange={e => setForgotPass(e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:10 }} />
                <input type="password" placeholder="Confirm new password" value={forgotConfirm} onChange={e => setForgotConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleResetPass()}
                  style={{ width:'100%', padding:'11px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:16 }} />
                <button onClick={handleResetPass} disabled={forgotLoading} style={{ width:'100%', padding:11, background:'linear-gradient(135deg,#00d4ff,#a855f7)', border:'none', borderRadius:8, color:'#0a0a0f', fontWeight:700, fontSize:14, cursor:forgotLoading?'not-allowed':'pointer', opacity:forgotLoading?0.7:1 }}>
                  {forgotLoading ? 'Updating...' : 'Update Password'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
