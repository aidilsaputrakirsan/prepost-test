// client/src/components/User/Leaderboard.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { getLeaderboard } from '../../services/api';
import Loading from '../Common/Loading';

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
        setError('');
        
        console.log('Fetching leaderboard data for quiz:', quizId);
        const response = await getLeaderboard(quizId);
        
        if (response.data && response.data.success) {
          setLeaderboard(response.data.data);
          console.log('Leaderboard data loaded successfully:', response.data.data);
        } else {
          console.error('Invalid leaderboard response:', response);
          setError('Format data papan peringkat tidak valid');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Gagal memuat papan peringkat. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUser, navigate, quizId]);

  if (loading) {
    return <Loading message="Memuat papan peringkat..." />;
  }

  // Safety check for undefined or missing data
  const hasValidData = leaderboard && Array.isArray(leaderboard.entries) && leaderboard.entries.length > 0;

  return (
    <div className="container">
      <div className="leaderboard-container" style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h2>Papan Peringkat</h2>
        
        {error && (
          <div className="error-message" style={{
            color: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p>{error}</p>
          </div>
        )}
        
        {!hasValidData && !error && (
          <div className="info-message" style={{
            color: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p>Tidak ada data papan peringkat untuk ditampilkan.</p>
          </div>
        )}
        
        {hasValidData && (
          <div className="leaderboard-table" style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '1.5rem'
            }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #e9ecef',
                    backgroundColor: '#f8f9fa'
                  }}>Peringkat</th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #e9ecef',
                    backgroundColor: '#f8f9fa'
                  }}>Nama</th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    borderBottom: '2px solid #e9ecef',
                    backgroundColor: '#f8f9fa'
                  }}>Skor</th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    borderBottom: '2px solid #e9ecef',
                    backgroundColor: '#f8f9fa'
                  }}>Benar</th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    borderBottom: '2px solid #e9ecef',
                    backgroundColor: '#f8f9fa'
                  }}>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.entries.map((entry, index) => {
                  const isCurrentUser = entry.user && currentUser && entry.user.toString() === currentUser._id.toString();
                  
                  return (
                    <tr 
                      key={index}
                      style={{
                        backgroundColor: isCurrentUser ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                        fontWeight: isCurrentUser ? 'bold' : 'normal'
                      }}
                    >
                      <td style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #e9ecef'
                      }}>{index + 1}</td>
                      <td style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        {entry.name}
                        {isCurrentUser && <span style={{ color: '#3498db', marginLeft: '0.5rem' }}>(Anda)</span>}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #e9ecef'
                      }}>{entry.score}</td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        {entry.correctAnswers} / {entry.totalQuestions}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #e9ecef'
                      }}>{entry.averageResponseTime ? (entry.averageResponseTime / 1000).toFixed(2) + 's' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="action-buttons" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <Link to={`/results/${quizId}`} className="btn btn-primary" style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            border: 'none'
          }}>
            Hasil Anda
          </Link>
          <Link to="/" className="btn btn-secondary" style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2c3e50',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            border: 'none'
          }}>
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;