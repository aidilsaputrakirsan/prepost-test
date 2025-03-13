// client/src/components/Admin/AdminPanel.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { createQuiz, getQuizzes } from '../../services/api';
import Loading from '../Common/Loading';

const AdminPanel = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customQuizId, setCustomQuizId] = useState('');
  const [showCustomId, setShowCustomId] = useState(false);
  const navigate = useNavigate();

  // Load quizzes when component mounts
  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/admin/login');
      return;
    }
    
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        
        // Try to get real quizzes from API
        try {
          const response = await getQuizzes();
          console.log('Fetched quizzes:', response);
          
          if (response.data?.success) {
            setQuizzes(response.data.data || []);
          } else {
            // Fallback to simulated quizzes if API fails
            console.log('Using simulated quizzes');
            const dummyQuizzes = [
              {
                _id: "quiz123",
                createdAt: new Date().toISOString(),
                status: 'waiting',
                participantCount: 0
              }
            ];
            setQuizzes(dummyQuizzes);
          }
        } catch (err) {
          console.error('Error fetching quizzes:', err);
          // Fallback to simulated quizzes
          const dummyQuizzes = [
            {
              _id: "quiz123",
              createdAt: new Date().toISOString(),
              status: 'waiting',
              participantCount: 0
            }
          ];
          setQuizzes(dummyQuizzes);
        }
      } catch (err) {
        console.error('Error in component:', err);
        setError('Gagal memuat daftar kuis');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [currentUser, navigate]);

  const handleCreateQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use custom ID if provided, otherwise generate random ID
      const quizId = customQuizId.trim() || `quiz${Math.floor(Math.random() * 10000)}`;
      
      // Call the API to create a new quiz
      const response = await createQuiz({ quizId });
      console.log('Create quiz response:', response);
      
      // Add the new quiz to the list
      if (response && response.data && response.data.success) {
        const newQuiz = response.data.data;
        
        setQuizzes([...quizzes, newQuiz]);
        setSuccess(`Kuis berhasil dibuat dengan ID: ${newQuiz._id}`);
        
        // Navigate to question creation page
        setTimeout(() => {
          navigate(`/admin/create-question/${newQuiz._id}`);
        }, 1000);
      } else {
        setError('Gagal membuat kuis. Coba lagi.');
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err.response?.data?.message || 'Gagal membuat kuis. Coba ID yang berbeda.');
    } finally {
      setLoading(false);
      setCustomQuizId('');
      setShowCustomId(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading && quizzes.length === 0) {
    return <Loading message="Memuat daftar kuis..." />;
  }

  return (
    <div className="container">
      <div className="admin-panel-container" style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
      }}>
        <div className="admin-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem"
        }}>
          <h2>Panel Admin</h2>
          <div className="admin-actions">
            <p>Selamat datang, {currentUser?.name || "Admin"}</p>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Logout
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
        
        {error && (
          <div className="error-message" style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            color: '#e74c3c',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        
        <div className="create-quiz" style={{ marginBottom: "2rem" }}>
          {showCustomId ? (
            <div style={{ marginBottom: "1rem" }}>
              <input
                type="text"
                value={customQuizId}
                onChange={(e) => setCustomQuizId(e.target.value)}
                placeholder="Masukkan ID kuis (opsional)"
                className="form-control"
                style={{ marginBottom: "0.5rem" }}
              />
              <div>
                <button
                  onClick={handleCreateQuiz}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ marginRight: "0.5rem" }}
                >
                  {loading ? 'Memproses...' : 'Buat Kuis'}
                </button>
                <button
                  onClick={() => setShowCustomId(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomId(true)}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Buat Kuis Baru'}
            </button>
          )}
        </div>
        
        <div className="quizzes-list">
          <h3>Kuis Anda</h3>
          
          {quizzes.length === 0 ? (
            <p>Belum ada kuis. Buat kuis baru untuk memulai.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e9ecef" }}>ID Kuis</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e9ecef" }}>Tanggal Dibuat</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e9ecef" }}>Status</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e9ecef" }}>Peserta</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e9ecef" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz._id}>
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>{quiz._id}</td>
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>
                        {new Date(quiz.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>
                        {quiz.status === 'waiting'
                          ? 'Menunggu'
                          : quiz.status === 'active'
                          ? 'Aktif'
                          : 'Selesai'}
                      </td>
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>
                        {quiz.participantCount || 0}
                      </td>
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Link
                            to={`/admin/create-question/${quiz._id}`}
                            className="btn btn-sm btn-primary"
                          >
                            Soal
                          </Link>
                          <Link
                            to={`/admin/participants/${quiz._id}`}
                            className="btn btn-sm btn-info"
                          >
                            Peserta
                          </Link>
                          <Link
                            to={`/admin/control/${quiz._id}`}
                            className="btn btn-sm btn-success"
                          >
                            Kontrol
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;