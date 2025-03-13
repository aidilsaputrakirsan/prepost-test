// client/src/components/User/Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
        
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn btn-primary">
            Bergabung
          </button>
        </form>
        
        <div className="admin-link">
          <p>
            Admin?{' '}
            <a href="/admin/login">Login di sini</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;