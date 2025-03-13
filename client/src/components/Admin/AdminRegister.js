// client/src/components/Admin/AdminRegister.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAdmin } from '../../services/api';

const AdminRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi
    if (!name || !email || !password || !confirmPassword) {
      setError('Semua field wajib diisi');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }
    
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Mencoba registrasi (mungkin tidak berhasil karena API belum siap)
      console.log('Mencoba registrasi admin:', { name, email, password });
      
      // Uncomment ini jika API sudah siap
      /* 
      await registerAdmin({ name, email, password });
      */
      
      // Untuk sementara, simulasikan success
      setTimeout(() => {
        setSuccess(true);
        
        // Redirect ke login setelah 3 detik
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      }, 1000);
    } catch (err) {
      console.error('Error registrasi:', err);
      setError(err.response?.data?.message || 'Gagal membuat akun admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-register-container" style={{
        maxWidth: "500px",
        margin: "0 auto",
        padding: "2rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
      }}>
        <h2>Daftar Akun Admin</h2>
        
        {success ? (
          <div className="success-message" style={{
            color: "#2ecc71",
            backgroundColor: "rgba(46, 204, 113, 0.1)",
            padding: "0.75rem",
            borderRadius: "4px",
            marginBottom: "1rem"
          }}>
            <p>Akun admin berhasil dibuat! Anda akan dialihkan ke halaman login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nama</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control"
                disabled={loading}
              />
            </div>
            
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
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control"
                disabled={loading}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>
        )}
        
        <div className="login-link" style={{ marginTop: "2rem" }}>
          <p>
            Sudah punya akun?{' '}
            <a href="/admin/login">Login di sini</a>
          </p>
        </div>
        
        <div className="back-link" style={{ marginTop: "1rem" }}>
          <a href="/">Kembali ke Beranda</a>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;