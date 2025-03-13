
// client/src/components/User/Leaderboard.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { getLeaderboard } from '../../services/api';

const Leaderboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    if (!currentUser) {
      navigate(`/join/${quizId}`);
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await getLeaderboard(quizId);
        setLeaderboard(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat papan peringkat');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUser, navigate, quizId]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Memuat papan peringkat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <Link to="/" className="btn btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="leaderboard-container">
        <h2>Papan Peringkat</h2>
        
        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th>Peringkat</th>
                <th>Nama</th>
                <th>Skor</th>
                <th>Benar</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((entry, index) => (
                <tr
                  key={index}
                  className={entry.user === currentUser._id ? 'current-user' : ''}
                >
                  <td>{index + 1}</td>
                  <td>{entry.name}</td>
                  <td>{entry.score}</td>
                  <td>
                    {entry.correctAnswers} / {entry.totalQuestions}
                  </td>
                  <td>{(entry.averageResponseTime / 1000).toFixed(2)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;