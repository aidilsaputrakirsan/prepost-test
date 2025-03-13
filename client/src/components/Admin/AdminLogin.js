// client/src/components/Admin/AdminLogin.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { loginAdmin } from '../../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@example.com'); // Pre-filled with admin email
  const [password, setPassword] = useState('admin123');    // Pre-filled with admin password
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
      
      // Use the real API
      const response = await loginAdmin({ email, password });
      
      // Check if we got a valid response
      if (response && response.token) {
        // Login user with the real token
        login(response);
        navigate('/admin/panel');
      } else {
        console.error('Invalid response from login API:', response);
        setError('Login gagal: Invalid response');
      }
    } catch (err) {
      console.error('Error login:', err);
      setError(err.response?.data?.message || 'Login gagal. Pastikan email dan password benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-login-container" style={{
        maxWidth: "500px",
        margin: "0 auto",
        padding: "2rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
      }}>
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
        
        <div className="back-link" style={{ marginTop: "1rem" }}>
          <Link to="/">Kembali ke Beranda</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;