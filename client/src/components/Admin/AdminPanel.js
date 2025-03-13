// client/src/components/Admin/AdminPanel.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const AdminPanel = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/admin/login');
      return;
    }
    
    // Simulasi quiz yang sudah ada
    setTimeout(() => {
      const dummyQuizzes = [
        {
          _id: "quiz123",
          createdAt: new Date().toISOString(),
          status: 'waiting',
          participantCount: 0
        }
      ];
      setQuizzes(dummyQuizzes);
    }, 500);
    
  }, [currentUser, navigate]);

  const handleCreateQuiz = async () => {
    try {
      setLoading(true);
      // Simulasi pembuatan quiz baru
      const newQuiz = {
        _id: "quiz" + Math.floor(Math.random() * 10000),
        createdAt: new Date().toISOString(),
        status: 'waiting',
        participantCount: 0
      };
      
      setQuizzes([...quizzes, newQuiz]);
      setTimeout(() => {
        navigate(`/admin/create-question/${newQuiz._id}`);
      }, 500);
    } catch (err) {
      setError('Gagal membuat kuis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

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
        
        <div className="create-quiz" style={{ marginBottom: "2rem" }}>
          <button
            onClick={handleCreateQuiz}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Buat Kuis Baru'}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
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
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>{new Date(quiz.createdAt).toLocaleString()}</td>
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>
                        {quiz.status === 'waiting'
                          ? 'Menunggu'
                          : quiz.status === 'active'
                          ? 'Aktif'
                          : 'Selesai'}
                      </td>
                      <td style={{ padding: "0.75rem", borderBottom: "1px solid #e9ecef" }}>{quiz.participantCount}</td>
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