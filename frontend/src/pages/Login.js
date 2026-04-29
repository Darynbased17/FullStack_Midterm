import React, { useState } from 'react';
import { login } from '../api';
import { Link } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const data = await login(username, password);
    setLoading(false);
    if (data.token) {
      onLogin(data.token);
    } else {
      setError(data.message || 'Login failed');
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>💹 PEX</div>
        <div style={s.subtitle}>Personal Exchange Platform</div>
        <h2 style={s.title}>Sign In</h2>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Username</label>
          <input style={s.input} placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={loading ? { ...s.btn, opacity: 0.7 } : s.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <p style={s.link}>No account? <Link to="/register" style={{ color: '#2563eb' }}>Register</Link></p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' },
  card: { background: '#fff', borderRadius: 20, padding: '48px 40px', width: 380, boxShadow: '0 4px 40px rgba(37,99,235,0.10)', border: '1px solid #e5e7f0' },
  logo: { fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 20px' },
  error: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', marginBottom: 16, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btn: { width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 },
  link: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontSize: 14 },
};