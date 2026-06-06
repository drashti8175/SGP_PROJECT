import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../App';
import { Stethoscope, Eye, EyeOff, UserPlus, LogIn, Lock, ArrowLeft, User, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return { question: code, answer: code };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const resetForm = () => {
    setForm({ username: '', password: '', confirmPassword: '' });
    setCaptchaInput('');
    setCaptchaError('');
    setCaptcha(generateCaptcha());
  };

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const pwMinLen   = form.password.length >= 8;
  const pwHasUpper = /[A-Z]/.test(form.password);
  const pwHasNum   = /[0-9]/.test(form.password);
  const pwMatch    = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return setError('Username is required.');
    if (!form.password) return setError('Password is required.');
    setError(''); setLoading(true);
    try {
      const data = await authService.loginWithUsername(form.username.trim(), form.password);
      login(data);
      navigate(`/${data.role}`);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setError(err.response?.data?.error || 'Login failed.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return setError('Username is required.');
    if (!form.password) return setError('Password is required.');

    // Validate captcha
    if (!captchaInput.trim()) { setCaptchaError('Please solve the captcha.'); return; }
    if (captchaInput.trim().toLowerCase() !== captcha.answer.toLowerCase()) {
      setCaptchaError('Incorrect answer. Try again.');
      refreshCaptcha();
      return;
    }

    setError(''); setCaptchaError(''); setLoading(true);
    try {
      await authService.registerWithUsername(form.username.trim(), form.password);
      setMode('login');
      resetForm();
      alert('✅ Registration successful! Please login.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
      refreshCaptcha();
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return setError('Username is required.');
    if (!pwMinLen || !pwHasUpper || !pwHasNum) return setError('Password does not meet requirements.');
    if (!pwMatch) return setError('Passwords do not match.');
    setError(''); setLoading(true);
    try {
      await authService.resetPasswordByUsername(form.username.trim(), form.password);
      setMode('login');
      resetForm();
      alert('✅ Password reset successfully! Please sign in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed.');
    } finally { setLoading(false); }
  };

  const usernameInput = (
    <div className="field-group">
      <label>Username</label>
      <div className="icon-input">
        <User size={16} className="input-icon" />
        <input type="text" placeholder="Enter your username" value={form.username}
          autoComplete="new-password" onChange={e => { set('username', e.target.value); setError(''); }} />
      </div>
    </div>
  );

  const passwordInput = (label = 'Password') => (
    <div className="field-group">
      <label>{label}</label>
      <div className="icon-input pass-wrap">
        <Lock size={16} className="input-icon" />
        <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
          autoComplete="new-password" value={form.password}
          onChange={e => { set('password', e.target.value); setError(''); }} required />
        <button type="button" onClick={() => setShowPass(s => !s)}>
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const captchaBox = (
    <div className="field-group">
      <label>Captcha Verification</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          borderRadius: 8, padding: '12px 20px',
          fontFamily: 'Georgia, serif',
          fontSize: 22, fontWeight: 900,
          color: '#fff', letterSpacing: 8,
          userSelect: 'none', minWidth: 160,
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          position: 'relative', overflow: 'hidden'
        }}>
          <span style={{ position: 'relative', zIndex: 1 }}>
            {captcha.question.split('').map((ch, i) => (
              <span key={i} style={{
                display: 'inline-block',
                transform: `rotate(${(Math.random() * 20 - 10).toFixed(0)}deg)`,
                color: ['#fff', '#bfdbfe', '#93c5fd', '#dbeafe'][i % 4]
              }}>{ch}</span>
            ))}
          </span>
        </div>
        <button type="button" onClick={refreshCaptcha}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
          title="Refresh captcha">
          <RefreshCw size={16} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Type the characters above"
        value={captchaInput}
        maxLength={6}
        onChange={e => { setCaptchaInput(e.target.value); setCaptchaError(''); }}
        style={{ borderColor: captchaError ? '#ef4444' : undefined, letterSpacing: 4, fontWeight: 700 }}
      />
      {captchaError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>✗ {captchaError}</div>}
    </div>
  );

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><Stethoscope size={28} /></div>
          <div><h1>MediCore</h1><p>Clinic Management System</p></div>
        </div>

        {mode !== 'forgot' && (
          <div className="tab-switch">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); resetForm(); }}>
              <LogIn size={14} /> Sign In
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); resetForm(); }}>
              <UserPlus size={14} /> Register
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

            {mode === 'forgot' ? (
              <form onSubmit={handleResetPassword} className="login-form" autoComplete="off">
                {usernameInput}
                {passwordInput('New Password')}
                {form.password.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    {[{ ok: pwMinLen, label: 'At least 8 characters' }, { ok: pwHasUpper, label: 'One uppercase letter' }, { ok: pwHasNum, label: 'One number' }].map(r => (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: r.ok ? '#10b981' : '#94a3b8', marginBottom: 2 }}>
                        <span>{r.ok ? '✓' : '○'}</span> {r.label}
                      </div>
                    ))}
                  </div>
                )}
                <div className="field-group">
                  <label>Confirm Password</label>
                  <div className="icon-input pass-wrap" style={{ borderColor: pwMismatch ? '#ef4444' : pwMatch ? '#10b981' : undefined }}>
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                      value={form.confirmPassword} onChange={e => { set('confirmPassword', e.target.value); setError(''); }} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {pwMatch    && <div style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>✓ Passwords match</div>}
                  {pwMismatch && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>✗ Passwords do not match</div>}
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-login" disabled={loading || !form.username.trim() || !pwMinLen || !pwHasUpper || !pwHasNum || !pwMatch}>
                  {loading ? 'Processing...' : 'Reset Password'}
                </button>
                <button type="button" className="forgot-link" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => { setMode('login'); setError(''); }}>
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </form>

            ) : mode === 'register' ? (
              <form onSubmit={handleRegister} className="login-form" autoComplete="off">
                {usernameInput}
                {passwordInput()}
                {captchaBox}
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-login" disabled={loading || !form.username.trim() || !form.password || !captchaInput.trim()}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

            ) : (
              <form onSubmit={handleLogin} className="login-form" autoComplete="off">
                {usernameInput}
                <div className="field-group">
                  <label>Password</label>
                  <div className="icon-input pass-wrap">
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                      value={form.password} onChange={e => set('password', e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  <span onClick={() => { setMode('forgot'); setError(''); }} className="forgot-link" style={{ cursor: 'pointer' }}>Forgot Password?</span>
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-login" disabled={loading || !form.username.trim()}>
                  {loading ? 'Please wait...' : 'Sign In'}
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
