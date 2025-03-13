// client/src/components/Admin/AdminLogin.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { loginAdmin } from '../../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password diperlukan');
      return;
    }

    try {
      setLoading(true);
      const userData = await loginAdmin({ email, password });
      
      if (!userData.isAdmin) {
        setError('Akses ditolak, anda bukan admin');
        return;
      }
      
      login(userData);
      navigate('/admin/panel');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-login-container">
        <h2>Admin Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
        
        <div className="register-link">
          <p>
            Belum punya akun admin?{' '}
            <a href="/admin/register">Daftar di sini</a>
          </p>
        </div>
        
        <div className="back-link">
          <a href="/">Kembali ke Beranda</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;