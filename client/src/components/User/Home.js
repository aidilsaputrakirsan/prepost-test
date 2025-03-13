// client/src/components/User/Home.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const [quizId, setQuizId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quizId.trim()) {
      setError('Masukkan ID kuis');
      return;
    }
    navigate(`/join/${quizId}`);
  };

  return (
    <div className="container">
      <div className="home-container">
        <h2>Selamat Datang di PrePostTEST</h2>
        <p>Masukkan ID kuis untuk bergabung</p>
        
        <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Masukkan ID kuis"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="form-control"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Bergabung
          </button>
        </form>
        
        <div style={{ marginTop: "2rem" }}>
          <p>
            Admin?{' '}
            <Link to="/admin/login">Login di sini</Link>
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            <Link to="/admin/register">Daftar akun admin baru</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;