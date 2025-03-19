// client/src/components/User/QuizResults.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import { getLeaderboard } from '../../services/api';
import Loading from '../Common/Loading';

const QuizResults = () => {
  const { currentUser } = useContext(AuthContext);
  const { quizStatus } = useContext(QuizContext);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [userEntry, setUserEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { quizId } = useParams();

  // Load leaderboard data when component mounts
  useEffect(() => {
    // Redirect if user is not logged in
    if (!currentUser) {
      navigate(`/join/${quizId}`);
      return;
    }

    // Redirect based on quiz status
    if (quizStatus === 'waiting') {
      navigate(`/waiting-room/${quizId}`);
      return;
    } else if (quizStatus === 'active') {
      navigate(`/quiz/${quizId}`);
      return;
    }

    // Function to fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching leaderboard for user results, quiz ID:', quizId);
        console.log('Current user ID:', currentUser._id);
        
        // Get leaderboard data
        const response = await getLeaderboard(quizId);
        
        if (!response || !response.data) {
          console.error('No response data from leaderboard API');
          setError('Gagal memuat data hasil. Server tidak merespon dengan benar.');
          setLoading(false);
          return;
        }
        
        if (!response.data.success) {
          console.error('Leaderboard API returned failure:', response.data);
          setError('Gagal memuat data hasil: ' + (response.data.message || 'Terjadi kesalahan pada server'));
          setLoading(false);
          return;
        }
        
        // Log the raw leaderboard data for debugging
        console.log('Raw leaderboard data:', response.data.data);
        
        // Store leaderboard data
        setLeaderboardData(response.data.data);
        
        // Check if entries exist and are in array format
        if (!response.data.data.entries || !Array.isArray(response.data.data.entries)) {
          console.error('Leaderboard data format is invalid - missing entries array:', response.data.data);
          setError('Format data peringkat tidak valid');
          setLoading(false);
          return;
        }
        
        // Make sure we have entries to process
        if (response.data.data.entries.length === 0) {
          console.log('Leaderboard has no entries');
          setLoading(false);
          return;
        }
        
        console.log('Leaderboard entries:', response.data.data.entries);
        
        // Find the current user's entry by comparing user IDs
        // Try different methods of comparison since the format might vary
        const userEntryIndex = response.data.data.entries.findIndex(entry => {
          // Try different types of comparison to handle all cases
          return (
            (entry.user && entry.user.toString() === currentUser._id.toString()) ||
            (entry.user && entry.user === currentUser._id) ||
            (entry.userId && entry.userId.toString() === currentUser._id.toString())
          );
        });
        
        console.log('User entry index in leaderboard:', userEntryIndex);
        
        if (userEntryIndex !== -1) {
          // User was found in the leaderboard
          const entry = response.data.data.entries[userEntryIndex];
          console.log('Found user entry:', entry);
          
          // Save the user's entry data and rank
          setUserEntry(entry);
          setUserRank(userEntryIndex + 1);
        } else {
          console.log('User not found in leaderboard entries');
          // If user is not in leaderboard, still try to show some information
          // based on what we have in currentUser
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Gagal memuat data hasil: ' + (err.message || 'Terjadi kesalahan pada jaringan'));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUser, navigate, quizId, quizStatus]);

  if (loading) {
    return <Loading message="Memuat hasil kuis..." />;
  }

  // Determine what to display for score and correct answers
  const displayScore = userEntry ? userEntry.score : currentUser.score || 0;
  
  // For correct answers, use the data from leaderboard or estimate from score
  let correctAnswers = 0;
  let totalQuestions = 0;
  
  if (userEntry) {
    // Use the values from the leaderboard entry
    correctAnswers = userEntry.correctAnswers || 0;
    totalQuestions = userEntry.totalQuestions || 0;
  } else if (leaderboardData && leaderboardData.entries && leaderboardData.entries.length > 0) {
    // If we have leaderboard data but no user entry, use the total questions from another entry
    totalQuestions = leaderboardData.entries[0].totalQuestions || 0;
    
    // Estimate correct answers based on score
    if (displayScore > 0) {
      // Basic formula: score is approximately 100 per correct answer + speed bonus
      correctAnswers = Math.round(displayScore / 150);
    }
  }
  
  // Force reasonable values if we have incongruent data
  if (displayScore > 200 && correctAnswers === 0) {
    correctAnswers = Math.max(1, Math.floor(displayScore / 150));
  }
  
  if (totalQuestions === 0 && correctAnswers > 0) {
    totalQuestions = Math.max(correctAnswers, 1);
  }

  return (
    <div className="container">
      <div className="quiz-results-container" style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2>Hasil Kuis</h2>
        
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
        
        <div className="result-card" style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="user-info" style={{
            marginBottom: '1.5rem',
            borderBottom: '1px solid #e9ecef',
            paddingBottom: '1rem'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Peserta</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{currentUser.name}</p>
          </div>
          
          <div className="score-info" style={{
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}>
            <div className="score-item" style={{ margin: '0.5rem' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Skor Total</h4>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>{displayScore}</p>
            </div>
            
            <div className="score-item" style={{ margin: '0.5rem' }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Jawaban Benar</h4>
              <p style={{ fontSize: '1.5rem' }}>
                <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{correctAnswers}</span>
                <span> / {totalQuestions}</span>
              </p>
            </div>
            
            {userRank && (
              <div className="score-item" style={{ margin: '0.5rem' }}>
                <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Peringkat</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>{userRank}</p>
              </div>
            )}
            
            {userEntry && userEntry.averageResponseTime > 0 && (
              <div className="score-item" style={{ margin: '0.5rem' }}>
                <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Waktu Respons</h4>
                <p style={{ fontSize: '1.25rem' }}>{(userEntry.averageResponseTime / 1000).toFixed(2)} detik</p>
              </div>
            )}
          </div>
          
          {userRank && leaderboardData && leaderboardData.entries && (
            <div className="rank-info" style={{
              backgroundColor: '#e8f4f8',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <p>
                Anda berada di posisi <strong>{userRank}</strong> dari {leaderboardData.entries.length} peserta
              </p>
            </div>
          )}
        </div>
        
        <div className="action-buttons" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <Link to={`/leaderboard/${quizId}`} className="btn btn-primary" style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            border: 'none'
          }}>
            Lihat Papan Peringkat
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

export default QuizResults;