import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../App';
import { Stethoscope, Eye, EyeOff, UserPlus, LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim().toLowerCase());
  const emailTouched = form.email.length > 0;
  const emailValid   = isValidEmail(form.email);
  const emailError   = emailTouched && !emailValid;

  const pwMinLen   = form.password.length >= 8;
  const pwHasUpper = /[A-Z]/.test(form.password);
  const pwHasNum   = /[0-9]/.test(form.password);
  const pwMatch    = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return setError('Email is required.');
    if (!emailValid) return setError('Only Gmail addresses are allowed (example@gmail.com)');
    if (!form.password) return setError('Password is required.');
    setError(''); setLoading(true);
    try {
      const data = await authService.login(form.email.trim().toLowerCase(), form.password);
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
    if (!form.email.trim()) return setError('Email is required.');
    if (!emailValid) return setError('Only Gmail addresses are allowed (example@gmail.com)');
    if (!form.password) return setError('Password is required.');
    setError(''); setLoading(true);
    try {
      await authService.register(form.name, form.email.trim().toLowerCase(), form.password);
      setMode('login');
      setError('');
      alert('Registration successful! Please login.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleResetPasswordDirect = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return setError('Email is required.');
    if (!emailValid) return setError('Only Gmail addresses are allowed (example@gmail.com)');
    if (!pwMinLen || !pwHasUpper || !pwHasNum) return setError('Password does not meet all requirements.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setError(''); setLoading(true);
    try {
      await authService.resetPasswordDirect(form.email.trim().toLowerCase(), form.password);
      setMode('login');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
      setError('');
      alert('✅ Password reset successfully! Please sign in.');
    } catch (err) {
      const serverError = err.response?.data?.error;
      const networkError = !err.response ? 'Server unreachable. Is your backend running?' : null;
      setError(serverError || networkError || 'Reset failed. Please try again.');
    } finally { setLoading(false); }
  };

  const emailBorder = emailError ? '#ef4444' : (emailValid && emailTouched) ? '#10b981' : undefined;

  const emailInput = (
    <div className="field-group">
      <label>Email Address</label>
      <div className="icon-input" style={{ borderColor: emailBorder, transition: 'border-color 0.25s' }}>
        <Mail size={16} className="input-icon" />
        <input
          type="text"
          placeholder="yourname@gmail.com"
          value={form.email}
          autoComplete="new-password"
          onChange={e => { set('email', e.target.value); setError(''); }}
        />
      </div>
      {emailError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>✗ Only Gmail addresses are allowed</div>}
      {emailValid && emailTouched && <div style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>✓ Valid Gmail address</div>}
    </div>
  );

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><Stethoscope size={28} /></div>
          <div>
            <h1>MediCore</h1>
            <p>Clinic Management System</p>
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="tab-switch">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setForm({ name: '', email: '', password: '', confirmPassword: '' }); }}>
              <LogIn size={14} /> Sign In
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setForm({ name: '', email: '', password: '', confirmPassword: '' }); }}>
              <UserPlus size={14} /> Register
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'forgot' ? (
              <form onSubmit={handleResetPasswordDirect} className="login-form" autoComplete="off">
                {emailInput}
                <div className="field-group">
                  <label>New Password</label>
                  <div className="icon-input pass-wrap">
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={e => { set('password', e.target.value); setError(''); }} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {form.password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {[{ ok: pwMinLen, label: 'At least 8 characters' }, { ok: pwHasUpper, label: 'One uppercase letter' }, { ok: pwHasNum, label: 'One number' }].map(r => (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: r.ok ? '#10b981' : '#94a3b8', marginBottom: 2 }}>
                          <span>{r.ok ? '✓' : '○'}</span> {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="field-group">
                  <label>Confirm Password</label>
                  <div className="icon-input pass-wrap" style={{ borderColor: pwMismatch ? '#ef4444' : pwMatch ? '#10b981' : undefined, transition: 'border-color 0.25s' }}>
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" value={form.confirmPassword} onChange={e => { set('confirmPassword', e.target.value); setError(''); }} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {pwMatch    && <div style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>✓ Passwords match</div>}
                  {pwMismatch && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>✗ Passwords do not match</div>}
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-login" disabled={loading || !emailValid || !pwMinLen || !pwHasUpper || !pwHasNum || !pwMatch}>
                  {loading ? 'Processing...' : 'Reset Password'}
                </button>
                <button type="button" className="forgot-link" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); }}>
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="login-form" autoComplete="off">
                {mode === 'register' && (
                  <div className="field-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="Your full name" autoComplete="new-password" value={form.name} onChange={e => set('name', e.target.value)} required />
                  </div>
                )}
                {emailInput}
                <div className="field-group">
                  <label>Password</label>
                  <div className="icon-input pass-wrap">
                    <Lock size={16} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={e => set('password', e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {mode === 'login' && <span onClick={() => { setMode('forgot'); setError(''); }} className="forgot-link" style={{ cursor: 'pointer' }}>Forgot Password?</span>}
                </div>
                {error && <div className="error-msg">{error}</div>}
                <button type="submit" className="btn-login" disabled={loading || !emailValid}>
                  {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
