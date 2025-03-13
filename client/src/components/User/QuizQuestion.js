// client/src/components/User/QuizQuestion.js
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import Timer from '../Common/Timer';
import Loading from '../Common/Loading';

const QuizQuestion = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentQuestion,
    timeLeft,
    quizStatus,
    answer,
    answerResult,
    submitAnswer,
    error: contextError
  } = useContext(QuizContext);
  
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [startTime, setStartTime] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [animation, setAnimation] = useState({});
  const [error, setError] = useState('');
  const questionRef = useRef(null);

  // Set error if context has one
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

    if (quizStatus === 'waiting') {
      navigate(`/waiting-room/${quizId}`);
    } else if (quizStatus === 'finished') {
      navigate(`/results/${quizId}`);
    }
  }, [currentUser, quizStatus, navigate, quizId]);

  // Reset startTime when a new question is received
  useEffect(() => {
    if (currentQuestion && answer === null && answerResult === null) {
      setStartTime(Date.now());
      setSelectedOption(null);
      setAnimation({
        animation: 'fadeIn 0.5s ease-out',
      });
      
      // Scroll to question
      if (questionRef.current) {
        questionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentQuestion, answer, answerResult]);

  // Highlight effect when time is running low
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && !answer && !answerResult) {
      setAnimation({
        animation: 'pulse 0.5s infinite',
      });
    }
  }, [timeLeft, answer, answerResult]);

  const handleOptionSelect = (index) => {
    if (!answer && !answerResult) {
      setSelectedOption(index);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null) {
      setError('Pilih satu jawaban!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!answer && !answerResult && startTime) {
      const responseTime = Date.now() - startTime;
      submitAnswer(
        currentUser._id,
        quizId,
        currentQuestion.id,
        selectedOption,
        responseTime
      );
    }
  };

  // Get option style based on answer status
  const getOptionStyle = (index) => {
    // If answer result received
    if (answerResult) {
      if (index === answerResult.correctOption) {
        return 'correct';
      }
      
      if (answer === index && !answerResult.isCorrect) {
        return 'incorrect';
      }
      
      return '';
    }
    
    // If answer submitted but no result yet
    if (answer !== null) {
      return answer === index ? 'selected' : '';
    }
    
    // If option is selected but not submitted
    return selectedOption === index ? 'selected' : '';
  };

  if (!currentQuestion) {
    return <Loading message="Memuat pertanyaan..." />;
  }

  return (
    <div className="container">
      <div className="quiz-question-container" ref={questionRef} style={{ ...animation }}>
        <div className="question-header">
          <h3>
            Pertanyaan {currentQuestion.questionNumber} dari {currentQuestion.totalQuestions}
          </h3>
          <Timer timeLeft={timeLeft} total={currentQuestion.timeLimit} />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="question-text">
          <p>{currentQuestion.text}</p>
        </div>
        
        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${getOptionStyle(index)}`}
              onClick={() => handleOptionSelect(index)}
              disabled={answer !== null || answerResult !== null}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>
        
        {!answer && !answerResult && (
          <button 
            onClick={handleAnswerSubmit}
            className="btn btn-primary"
            disabled={selectedOption === null}
            style={{ marginTop: '1rem' }}
          >
            Kirim Jawaban
          </button>
        )}
        
        {answerResult && (
          <div className={`answer-result ${answerResult.isCorrect ? 'correct' : 'incorrect'}`}>
            {answerResult.isCorrect
              ? '✓ Jawaban benar!'
              : '✗ Jawaban salah!'}
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Jawaban yang benar: 
              <strong> {String.fromCharCode(65 + answerResult.correctOption)} - {currentQuestion.options[answerResult.correctOption]}</strong>
            </p>
          </div>
        )}
        
        <div className="waiting-next" style={{ 
          marginTop: '1.5rem', 
          textAlign: 'center',
          opacity: answerResult ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}>
          <p>Menunggu pertanyaan berikutnya...</p>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;