// client/src/components/Admin/ParticipantsList.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import { getQuizParticipants } from '../../services/api';

const ParticipantsList = () => {
  const { currentUser } = useContext(AuthContext);
  const { removeParticipant } = useContext(QuizContext);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/admin/login');
      return;
    }

    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const response = await getQuizParticipants(quizId);
        setParticipants(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat peserta');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
    
    // Set up interval to refresh participants list
    const intervalId = setInterval(fetchParticipants, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, navigate, quizId]);

  const handleRemoveParticipant = (userId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus peserta ini?')) {
      removeParticipant(quizId, currentUser._id, userId);
      
      // Update local participants list
      setParticipants(participants.filter(p => p._id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Memuat daftar peserta...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="participants-list-container">
        <div className="page-header">
          <h2>Daftar Peserta</h2>
          <div>
            <Link to="/admin/panel" className="btn btn-secondary">
              Kembali ke Panel
            </Link>
          </div>
        </div>
        
        <div className="quiz-info">
          <p>ID Kuis: {quizId}</p>
          <p>Jumlah Peserta: {participants.length}</p>
          <p>Kode Peserta: <strong>{window.location.origin}/join/{quizId}</strong></p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="participants-table">
          {participants.length === 0 ? (
            <p>Belum ada peserta yang bergabung.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Skor</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant, index) => (
                  <tr key={participant._id}>
                    <td>{index + 1}</td>
                    <td>{participant.name}</td>
                    <td>{participant.score}</td>
                    <td>
                      <button
                        onClick={() => handleRemoveParticipant(participant._id)}
                        className="btn btn-sm btn-danger"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="action-buttons">
          <Link to={`/admin/create-question/${quizId}`} className="btn btn-primary">
            Edit Pertanyaan
          </Link>
          <Link to={`/admin/control/${quizId}`} className="btn btn-success">
            Kontrol Kuis
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;