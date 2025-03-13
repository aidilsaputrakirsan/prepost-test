// client/src/components/Admin/QuizControl.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import { getQuizById, getQuizQuestions, getLeaderboard } from '../../services/api';
import Loading from '../Common/Loading';

const QuizControl = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { 
    quizStatus, 
    startQuiz, 
    stopQuiz, 
    resetQuiz,
    error: contextError,
    clearError
  } = useContext(QuizContext);
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();
  const { quizId } = useParams();

  // Clear context errors when component mounts
  useEffect(() => {
    if (clearError) clearError();
  }, [clearError]);

  // Display context errors if they occur
  useEffect(() => {
    if (contextError) {
      setError(contextError);
      setTimeout(() => setError(''), 5000);
    }
  }, [contextError]);

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/admin/login');
      return;
    }

    const fetchQuizData = async () => {
      try {
        setLoading(true);
        console.log('Fetching quiz data for ID:', quizId);
        
        // Fetch quiz data
        const quizResponse = await getQuizById(quizId);
        console.log('Quiz response:', quizResponse);
        
        if (quizResponse.data?.success) {
          setQuiz(quizResponse.data.data);
          
          // Update local quiz status based on fetched quiz
          if (quizResponse.data.data.status === 'waiting' && quizStatus !== 'waiting') {
            setSuccess('Quiz sedang menunggu untuk dimulai');
          } else if (quizResponse.data.data.status === 'active' && quizStatus !== 'active') {
            setSuccess('Quiz sedang berjalan');
          } else if (quizResponse.data.data.status === 'finished' && quizStatus !== 'finished') {
            setSuccess('Quiz telah selesai');
          }
          
          // Fetch questions
          try {
            const questionsResponse = await getQuizQuestions(quizId);
            console.log('Questions response:', questionsResponse);
            
            if (questionsResponse.data?.success) {
              setQuestions(questionsResponse.data.data || []);
            }
          } catch (questionsErr) {
            console.error('Error fetching questions:', questionsErr);
          }
          
          // Fetch leaderboard if quiz is finished
          if (quizResponse.data.data.status === 'finished') {
            try {
              const leaderboardResponse = await getLeaderboard(quizId);
              if (leaderboardResponse.data?.success) {
                setLeaderboard(leaderboardResponse.data.data);
              }
            } catch (leaderboardErr) {
              console.log('Leaderboard not available yet:', leaderboardErr);
            }
          }
        } else {
          setError('Quiz tidak ditemukan atau terjadi kesalahan saat memuat data');
          console.error('Quiz data not found in response:', quizResponse);
        }
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(err.response?.data?.message || 'Gagal memuat data kuis');
        
        // If quiz not found, offer to create a new one
        if (err.response?.status === 404) {
          setError(`Quiz dengan ID "${quizId}" tidak ditemukan. Silakan buat quiz baru.`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
    
    // Refresh data periodically
    const intervalId = setInterval(fetchQuizData, 10000); // Every 10 seconds
    
    return () => {
      clearInterval(intervalId);
      if (countdown) {
        clearInterval(countdown);
      }
    };
  }, [currentUser, navigate, quizId, quizStatus, countdown]);

  const handleStartQuiz = () => {
    if (!quiz) {
      setError('Quiz tidak ditemukan');
      return;
    }
    
    if (questions.length === 0) {
      setError('Tidak dapat memulai kuis tanpa pertanyaan');
      return;
    }
    
    if (quiz.status === 'waiting') {
      // Show countdown before starting
      let count = 5;
      setCountdown(count);
      
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        
        if (count <= 0) {
          clearInterval(countdownInterval);
          setCountdown(null);
          startQuiz(quizId, currentUser._id);
          setSuccess('Kuis dimulai!');
          setTimeout(() => setSuccess(''), 3000);
        }
      }, 1000);
    }
  };

  const handleStopQuiz = () => {
    if (!quiz) {
      setError('Quiz tidak ditemukan');
      return;
    }
    
    if (window.confirm('Apakah Anda yakin ingin menghentikan kuis ini?')) {
      if (quiz.status === 'active') {
        stopQuiz(quizId, currentUser._id);
        setSuccess('Kuis dihentikan!');
        setTimeout(() => setSuccess(''), 3000);
      }
    }
  };

  const handleResetQuiz = () => {
    if (!quiz) {
      setError('Quiz tidak ditemukan');
      return;
    }
    
    if (window.confirm('Apakah Anda yakin ingin mereset kuis? Semua progres peserta akan dihapus.')) {
      resetQuiz(quizId, currentUser._id);
      setSuccess('Kuis direset!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting':
        return 'Menunggu';
      case 'active':
        return 'Aktif';
      case 'finished':
        return 'Selesai';
      default:
        return status;
    }
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case 'waiting':
        return 'status-waiting';
      case 'active':
        return 'status-active';
      case 'finished':
        return 'status-finished';
      default:
        return '';
    }
  };

  if (loading) {
    return <Loading message="Memuat data kuis..." />;
  }

  // Handle case where quiz is null
  if (!quiz) {
    return (
      <div className="container">
        <div className="quiz-control-container" style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          textAlign: "center"
        }}>
          <h2>Kontrol Kuis</h2>
          
          <div className="alert-error" style={{
            backgroundColor: "rgba(231, 76, 60, 0.1)",
            color: "#e74c3c",
            padding: "1rem",
            borderRadius: "4px",
            margin: "1rem 0",
            textAlign: "left"
          }}>
            <p><strong>Error:</strong> {error || `Quiz dengan ID "${quizId}" tidak ditemukan.`}</p>
          </div>
          
          <p>Kemungkinan penyebab:</p>
          <ul style={{ textAlign: "left", marginBottom: "2rem" }}>
            <li>Quiz dengan ID tersebut belum dibuat</li>
            <li>Quiz telah dihapus</li>
            <li>Terjadi kesalahan pada server</li>
          </ul>
          
          <div className="action-buttons">
            <Link to="/admin/panel" className="btn btn-primary">
              Kembali ke Panel Admin
            </Link>
          </div>
        </div>
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
            <span className={getStatusClassName(quiz.status)}>
              {getStatusText(quiz.status)}
            </span>
          </p>
          <p>Jumlah Pertanyaan: {questions.length}</p>
          <p>Jumlah Peserta: {quiz.participantCount || 0}</p>
          {quiz.status === 'active' && (
            <p>
              Pertanyaan Saat Ini: {(quiz.currentQuestionIndex || 0) + 1} dari {quiz.questionCount || questions.length}
            </p>
          )}
          
          <div>
            <p>Link untuk peserta: </p>
            <code>{window.location.origin}/join/{quizId}</code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${quizId}`);
                setSuccess('Link berhasil disalin!');
                setTimeout(() => setSuccess(''), 3000);
              }}
              className="btn btn-sm btn-info"
              style={{ marginLeft: '10px' }}
            >
              Salin Link
            </button>
          </div>
        </div>
        
        {success && (
          <div className="success-message" style={{
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            color: '#2ecc71',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {success}
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="control-buttons" style={{ marginTop: '1.5rem' }}>
          {quiz.status === 'waiting' && (
            <>
              {countdown !== null ? (
                <div className="countdown-container" style={{ 
                  textAlign: 'center', 
                  padding: '1rem',
                  backgroundColor: 'rgba(52, 152, 219, 0.1)', 
                  borderRadius: '8px', 
                  marginBottom: '1rem' 
                }}>
                  <h3>Kuis akan dimulai dalam {countdown} detik...</h3>
                  <button 
                    onClick={() => {
                      clearInterval(countdown);
                      setCountdown(null);
                    }}
                    className="btn btn-warning"
                  >
                    Batalkan
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartQuiz}
                  className="btn btn-success"
                  disabled={questions.length === 0}
                >
                  Mulai Kuis
                </button>
              )}
            </>
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
          <div className="waiting-info" style={{ 
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderRadius: '8px'
          }}>
            <h3>Kuis Belum Dimulai</h3>
            <p>Klik "Mulai Kuis" untuk memulai kuis setelah semua peserta bergabung.</p>
            <p>Pastikan Anda telah menambahkan pertanyaan sebelum memulai kuis.</p>
            <p>Peserta dapat bergabung menggunakan link: <strong>{window.location.origin}/join/{quizId}</strong></p>
          </div>
        )}
        
        {quiz.status === 'finished' && leaderboard && (
          <div className="leaderboard-section" style={{ marginTop: '2rem' }}>
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
        
        <div className="action-buttons" style={{ marginTop: '2rem' }}>
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