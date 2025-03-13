// client/src/components/Admin/AdminLogin.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
// import { loginAdmin } from '../../services/api';

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
      
      // Untuk sementara, simulasikan login berhasil
      console.log('Mencoba login dengan:', { email, password });
      
      // Simulasi delay dari API call
      setTimeout(() => {
        // Buat data user dummy
        const userData = {
          _id: "admin123",
          name: "Admin User",
          email: email,
          isAdmin: true,
          token: "dummy_token_123456"
        };
        
        // Login user
        login(userData);
        
        // Redirect ke panel admin
        navigate('/admin/panel');
      }, 1000);
      
      /* 
      // Uncomment ini jika API sudah siap
      const userData = await loginAdmin({ email, password });
      
      if (!userData.isAdmin) {
        setError('Akses ditolak, anda bukan admin');
        return;
      }
      
      login(userData);
      navigate('/admin/panel');
      */
      
    } catch (err) {
      console.error('Error login:', err);
      setError(err.response?.data?.message || 'Login gagal');
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
        
        <div className="register-link" style={{ marginTop: "2rem" }}>
          <p>
            Belum punya akun admin?{' '}
            <Link to="/admin/register">Daftar di sini</Link>
          </p>
        </div>
        
        <div className="back-link" style={{ marginTop: "1rem" }}>
          <Link to="/">Kembali ke Beranda</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;