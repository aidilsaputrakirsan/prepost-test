// client/src/components/User/EnterName.js
import React, { useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
      setError('');
      
      console.log('Joining quiz with:', { name, quizId });
      const userData = await createParticipant({ name, quizId });
      
      if (userData && userData._id) {
        login(userData);
        navigate(`/waiting-room/${quizId}`);
      } else {
        console.error('Invalid response from createParticipant:', userData);
        setError('Gagal bergabung dengan kuis');
      }
    } catch (err) {
      console.error('Join error:', err);
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mencoba bergabung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="enter-name-container" style={{
        maxWidth: "500px",
        margin: "2rem auto",
        padding: "2rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
      }}>
        <h2>Masukkan Nama Anda</h2>
        <p>Untuk bergabung dengan kuis {quizId}</p>
        
        {error && (
          <div className="error-message" style={{
            color: "#e74c3c",
            backgroundColor: "rgba(231, 76, 60, 0.1)",
            padding: "0.75rem",
            borderRadius: "4px",
            marginBottom: "1rem"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                marginBottom: "1rem"
              }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Memproses...' : 'Bergabung'}
          </button>
        </form>
        
        <div className="back-link" style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link to="/" style={{ color: "#3498db", textDecoration: "none" }}>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EnterName;