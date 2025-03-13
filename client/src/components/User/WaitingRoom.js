
// client/src/components/User/WaitingRoom.js
import React, { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';

const WaitingRoom = () => {
  const { currentUser } = useContext(AuthContext);
  const { joinWaitingRoom, quizStatus, participants, error } = useContext(QuizContext);
  const navigate = useNavigate();
  const { quizId } = useParams();

  useEffect(() => {
    if (!currentUser) {
      navigate(`/join/${quizId}`);
      return;
    }

    // Join waiting room
    joinWaitingRoom(currentUser._id, quizId);
  }, [currentUser, quizId, joinWaitingRoom, navigate]);

  // Redirect when quiz starts
  useEffect(() => {
    if (quizStatus === 'active') {
      navigate(`/quiz/${quizId}`);
    }
  }, [quizStatus, navigate, quizId]);

  return (
    <div className="container">
      <div className="waiting-room-container">
        <h2>Ruang Tunggu</h2>
        <p>Menunggu admin memulai kuis...</p>
        
        <div className="user-info">
          <p>Nama: {currentUser?.name}</p>
          <p>ID Kuis: {quizId}</p>
        </div>
        
        <div className="participants-list">
          <h3>Peserta ({participants.length})</h3>
          <ul>
            {participants.map((participant, index) => (
              <li key={index}>{participant.name}</li>
            ))}
          </ul>
        </div>
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default WaitingRoom;