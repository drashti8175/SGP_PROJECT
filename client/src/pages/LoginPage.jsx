import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../App';
import { Stethoscope, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await authService.login(form.email, form.password);
      login(data);
      navigate(`/${data.role}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed.';
      // Clear stale token if exists
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authService.register(form.name, form.email, form.password);
      setMode('login');
      setError('');
      alert('Registration successful! Please login.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const demoAccounts = [
    { label: 'Patient', email: 'sachet@gmail.com', password: '1234', color: '#10b981', icon: '🧑‍⚕️' },
    { label: 'Doctor', email: 'sushma@clinic.com', password: '1234', color: '#2563eb', icon: '👨‍⚕️' },
    { label: 'Receptionist', email: 'reception@clinic.com', password: '1234', color: '#0891b2', icon: '🏥' },
    { label: 'Admin', email: 'admin@clinic.com', password: '1234', color: '#7c3aed', icon: '⚙️' },
  ];

  const fillDemo = (acc) => setForm({ name: '', email: acc.email, password: acc.password });

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

        <div className="tab-switch">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>
            <LogIn size={14} /> Sign In
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>
            <UserPlus size={14} /> Register
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="login-form">
          {mode === 'register' && (
            <div className="field-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
          )}
          <div className="field-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@clinic.com" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="field-group">
            <label>Password</label>
            <div className="pass-wrap">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
              <button type="button" onClick={() => setShowPass(s => !s)}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="demo-section">
            <p className="demo-label">Quick Demo Access</p>
            <div className="demo-btns-grid">
              {demoAccounts.map(acc => (
                <button key={acc.label} onClick={() => fillDemo(acc)}
                  style={{ borderColor: acc.color, background: `${acc.color}10` }}>
                  <span>{acc.icon}</span>
                  <span style={{ color: acc.color, fontWeight: 700 }}>{acc.label}</span>
                </button>
              ))}
            </div>
            <p className="demo-hint">All passwords: <strong>1234</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
