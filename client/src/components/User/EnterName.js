
// client/src/components/User/EnterName.js
import React, { useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { createParticipant } from '../../services/api';

const EnterName = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { quizId } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama diperlukan');
      return;
    }

    try {
      setLoading(true);
      const userData = await createParticipant({ name, quizId });
      login(userData);
      navigate(`/waiting-room/${quizId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="enter-name-container">
        <h2>Masukkan Nama Anda</h2>
        <p>Untuk bergabung dengan kuis {quizId}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : 'Bergabung'}
          </button>
        </form>
        
        <div className="back-link">
          <a href="/">Kembali</a>
        </div>
      </div>
    </div>
  );
};

export default EnterName;