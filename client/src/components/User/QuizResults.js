
// client/src/components/User/QuizResults.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import { getLeaderboard } from '../../services/api';

const QuizResults = () => {
  const { currentUser } = useContext(AuthContext);
  const { quizStatus } = useContext(QuizContext);
  const [results, setResults] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    if (!currentUser) {
      navigate(`/join/${quizId}`);
      return;
    }

    if (quizStatus === 'waiting') {
      navigate(`/waiting-room/${quizId}`);
    } else if (quizStatus === 'active') {
      navigate(`/quiz/${quizId}`);
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await getLeaderboard(quizId);
        setResults(response.data);
        
        // Find user's rank
        const userEntry = response.data.entries.findIndex(
          entry => entry.user === currentUser._id
        );
        setUserRank(userEntry !== -1 ? userEntry + 1 : null);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat hasil');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [currentUser, quizStatus, navigate, quizId]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Memuat hasil...</div>
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

  // Find user's result
  const userResult = results?.entries.find(entry => entry.user === currentUser._id);

  return (
    <div className="container">
      <div className="quiz-results-container">
        <h2>Hasil Kuis</h2>
        
        {userResult ? (
          <div className="user-result">
            <h3>Hasil Anda</h3>
            <div className="result-info">
              <p>Peringkat: {userRank} dari {results.entries.length}</p>
              <p>Skor: {userResult.score}</p>
              <p>Jawaban Benar: {userResult.correctAnswers} dari {userResult.totalQuestions}</p>
              <p>Rata-rata Waktu: {(userResult.averageResponseTime / 1000).toFixed(2)} detik</p>
            </div>
          </div>
        ) : (
          <div className="no-result">
            <p>Hasil Anda tidak tersedia.</p>
          </div>
        )}
        
        <div className="action-buttons">
          <Link to={`/leaderboard/${quizId}`} className="btn btn-primary">
            Lihat Papan Peringkat
          </Link>
          <Link to="/" className="btn btn-secondary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;