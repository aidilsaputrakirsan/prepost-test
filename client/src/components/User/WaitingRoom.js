// client/src/components/User/WaitingRoom.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import Loading from '../Common/Loading';

const WaitingRoom = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { 
    joinWaitingRoom, 
    quizStatus, 
    participants, 
    error: contextError,
    isConnected 
  } = useContext(QuizContext);
  
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [randomQuotes, setRandomQuotes] = useState([
    "Ambil napas dalam-dalam dan bersiaplah untuk tes ini!",
    "Jangan khawatir, ini hanya kuis. Yang penting ikut berpartisipasi!",
    "Ingat, kuis ini dirancang untuk membantu Anda belajar.",
    "Siap-siap! Kuis ini bisa dimulai kapan saja.",
    "Bersiaplah untuk menunjukkan pengetahuan Anda!"
  ]);
  const [currentQuote, setCurrentQuote] = useState('');
  const [loading, setLoading] = useState(true);

  // Handle connection status
  useEffect(() => {
    if (!isConnected) {
      setError('Sedang menghubungkan ke server...');
    } else {
      setError('');
    }
  }, [isConnected]);

  // Set error from context
  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate(`/join/${quizId}`);
      return;
    }
    setLoading(false);
  }, [currentUser, navigate, quizId]);

  // Join waiting room
  useEffect(() => {
    if (currentUser && isConnected && !joined) {
      joinWaitingRoom(currentUser._id, quizId);
      setJoined(true);
    }
  }, [currentUser, quizId, joinWaitingRoom, isConnected, joined]);

  // Redirect when quiz starts
  useEffect(() => {
    if (quizStatus === 'active') {
      navigate(`/quiz/${quizId}`);
    } else if (quizStatus === 'finished') {
      navigate(`/results/${quizId}`);
    }
  }, [quizStatus, navigate, quizId]);

  // Random quotes
  useEffect(() => {
    // Initial quote
    setCurrentQuote(randomQuotes[Math.floor(Math.random() * randomQuotes.length)]);
    
    // Change quote every 8 seconds
    const interval = setInterval(() => {
      setCurrentQuote(randomQuotes[Math.floor(Math.random() * randomQuotes.length)]);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [randomQuotes]);

  const handleLeaveRoom = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari ruang tunggu?')) {
      logout();
      navigate('/');
    }
  };

  if (loading) {
    return <Loading message="Memuat ruang tunggu..." />;
  }

  return (
    <div className="container">
      <div className="waiting-room-container">
        <h2>Ruang Tunggu</h2>
        
        <div className="waiting-status" style={{
          textAlign: 'center',
          margin: '1.5rem 0',
          padding: '1rem',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '1.1rem' }}>Menunggu admin memulai kuis...</p>
          <div className="loading-indicator" style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '1rem 0'
          }}>
            <div className="spinner"></div>
          </div>
          <p style={{ fontStyle: 'italic' }}>{currentQuote}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="user-info" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p><strong>Nama:</strong> {currentUser?.name}</p>
            <p><strong>ID Kuis:</strong> {quizId}</p>
          </div>
          <button onClick={handleLeaveRoom} className="btn btn-danger">
            Keluar
          </button>
        </div>
        
        <div className="participants-list">
          <h3>Peserta ({participants.length})</h3>
          {participants.length === 0 ? (
            <p style={{ fontStyle: 'italic', textAlign: 'center' }}>
              Belum ada peserta yang bergabung...
            </p>
          ) : (
            <div className="participants-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.5rem',
              maxHeight: '250px',
              overflowY: 'auto',
              padding: '0.5rem',
              backgroundColor: 'rgba(236, 240, 241, 0.5)',
              borderRadius: '8px'
            }}>
              {participants.map((participant, index) => (
                <div 
                  key={index} 
                  className="participant-item"
                  style={{
                    padding: '0.5rem',
                    backgroundColor: currentUser._id === participant._id ? 'rgba(52, 152, 219, 0.1)' : 'white',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div 
                    className="participant-avatar"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: `hsl(${(index * 70) % 360}, 70%, 80%)`,
                      marginRight: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{participant.name}</span>
                  {currentUser._id === participant._id && (
                    <span style={{ marginLeft: '4px', fontSize: '0.8em', color: '#3498db' }}> (Anda)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="info-box" style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderRadius: '8px'
        }}>
          <h4>Petunjuk:</h4>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Tunggu hingga admin memulai kuis</li>
            <li>Siapkan diri Anda untuk menjawab pertanyaan</li>
            <li>Setiap pertanyaan memiliki batas waktu</li>
            <li>Skor Anda bergantung pada jawaban benar dan kecepatan menjawab</li>
          </ul>
        </div>
        
        <div className="waiting-actions" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;