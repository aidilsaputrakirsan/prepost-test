// client/src/components/Admin/QuizControl.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import { getQuizById, getQuizQuestions, getLeaderboard } from '../../services/api';

const QuizControl = () => {
  const { currentUser } = useContext(AuthContext);
  const { quizStatus, startQuiz, stopQuiz, resetQuiz } = useContext(QuizContext);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/admin/login');
      return;
    }

    const fetchQuizData = async () => {
      try {
        setLoading(true);
        
        // Fetch quiz data
        const quizResponse = await getQuizById(quizId);
        setQuiz(quizResponse.data.data);
        
        // Fetch questions
        const questionsResponse = await getQuizQuestions(quizId);
        setQuestions(questionsResponse.data);
        
        // Fetch leaderboard if quiz is finished
        if (quizResponse.data.data.status === 'finished') {
          try {
            const leaderboardResponse = await getLeaderboard(quizId);
            setLeaderboard(leaderboardResponse.data);
          } catch (err) {
            // Leaderboard might not be available yet
            console.log('Leaderboard not available yet');
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat data kuis');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
    
    // Refresh data periodically
    const intervalId = setInterval(fetchQuizData, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, navigate, quizId, quizStatus]);

  const handleStartQuiz = () => {
    if (questions.length === 0) {
      setError('Tidak dapat memulai kuis tanpa pertanyaan');
      return;
    }
    
    if (quiz.status === 'waiting') {
      startQuiz(quizId, currentUser._id);
    }
  };

  const handleStopQuiz = () => {
    if (quiz.status === 'active') {
      stopQuiz(quizId, currentUser._id);
    }
  };

  const handleResetQuiz = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset kuis? Semua progres peserta akan dihapus.')) {
      resetQuiz(quizId, currentUser._id);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Memuat data kuis...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="quiz-control-container">
        <div className="page-header">
          <h2>Kontrol Kuis</h2>
          <div>
            <Link to="/admin/panel" className="btn btn-secondary">
              Kembali ke Panel
            </Link>
          </div>
        </div>
        
        <div className="quiz-info">
          <p>ID Kuis: {quizId}</p>
          <p>
            Status:{' '}
            <span className={`status-${quiz.status}`}>
              {quiz.status === 'waiting'
                ? 'Menunggu'
                : quiz.status === 'active'
                ? 'Aktif'
                : 'Selesai'}
            </span>
          </p>
          <p>Jumlah Pertanyaan: {questions.length}</p>
          <p>Jumlah Peserta: {quiz.participantCount}</p>
          {quiz.status === 'active' && (
            <p>
              Pertanyaan Saat Ini: {quiz.currentQuestionIndex + 1} dari {quiz.questionCount}
            </p>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="control-buttons">
          {quiz.status === 'waiting' && (
            <button
              onClick={handleStartQuiz}
              className="btn btn-success"
              disabled={questions.length === 0}
            >
              Mulai Kuis
            </button>
          )}
          
          {quiz.status === 'active' && (
            <button
              onClick={handleStopQuiz}
              className="btn btn-danger"
            >
              Hentikan Kuis
            </button>
          )}
          
          {quiz.status === 'finished' && (
            <button
              onClick={handleResetQuiz}
              className="btn btn-warning"
            >
              Reset Kuis
            </button>
          )}
        </div>
        
        {quiz.status === 'waiting' && (
          <div className="waiting-info">
            <h3>Kuis Belum Dimulai</h3>
            <p>Klik "Mulai Kuis" untuk memulai kuis setelah semua peserta bergabung.</p>
            <p>Kode Peserta: <strong>{window.location.origin}/join/{quizId}</strong></p>
          </div>
        )}
        
        {quiz.status === 'finished' && leaderboard && (
          <div className="leaderboard-section">
            <h3>Leaderboard</h3>
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
                  <tr key={index}>
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
        )}
        
        <div className="action-buttons">
          <Link to={`/admin/create-question/${quizId}`} className="btn btn-primary">
            Edit Pertanyaan
          </Link>
          <Link to={`/admin/participants/${quizId}`} className="btn btn-info">
            Lihat Peserta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizControl;