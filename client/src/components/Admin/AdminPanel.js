
// client/src/components/Admin/AdminPanel.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { createQuiz } from '../../services/api';

const AdminPanel = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/admin/login');
    }
    
    // In a real app, you'd fetch existing quizzes here
    // For now, we'll just use localStorage to demonstrate
    const storedQuizzes = localStorage.getItem('adminQuizzes');
    if (storedQuizzes) {
      setQuizzes(JSON.parse(storedQuizzes));
    }
  }, [currentUser, navigate]);

  const handleCreateQuiz = async () => {
    try {
      setLoading(true);
      const response = await createQuiz();
      
      const newQuiz = {
        _id: response.data._id,
        createdAt: new Date().toISOString(),
        status: 'waiting',
        participantCount: 0
      };
      
      const updatedQuizzes = [...quizzes, newQuiz];
      setQuizzes(updatedQuizzes);
      
      // Save to localStorage for demo purposes
      localStorage.setItem('adminQuizzes', JSON.stringify(updatedQuizzes));
      
      // Navigate to create questions page
      navigate(`/admin/create-question/${newQuiz._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat kuis');
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
      <div className="admin-panel-container">
        <div className="admin-header">
          <h2>Panel Admin</h2>
          <div className="admin-actions">
            <p>Selamat datang, {currentUser?.name}</p>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="create-quiz">
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
            <table>
              <thead>
                <tr>
                  <th>ID Kuis</th>
                  <th>Tanggal Dibuat</th>
                  <th>Status</th>
                  <th>Peserta</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz._id}>
                    <td>{quiz._id}</td>
                    <td>{new Date(quiz.createdAt).toLocaleString()}</td>
                    <td>
                      {quiz.status === 'waiting'
                        ? 'Menunggu'
                        : quiz.status === 'active'
                        ? 'Aktif'
                        : 'Selesai'}
                    </td>
                    <td>{quiz.participantCount}</td>
                    <td>
                      <div className="quiz-actions">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;