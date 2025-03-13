
// client/src/components/User/QuizQuestion.js
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { QuizContext } from '../../contexts/QuizContext';
import Timer from '../Common/Timer';

const QuizQuestion = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentQuestion,
    timeLeft,
    quizStatus,
    answer,
    answerResult,
    submitAnswer
  } = useContext(QuizContext);
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [startTime, setStartTime] = useState(null);

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
    if (currentQuestion && !answer) {
      setStartTime(Date.now());
    }
  }, [currentQuestion, answer]);

  const handleAnswerSubmit = (selectedOption) => {
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

  // Get option background color based on answer status
  const getOptionStyle = (index) => {
    if (!answerResult) {
      return answer === index ? 'selected' : '';
    }
    
    if (index === answerResult.correctOption) {
      return 'correct';
    }
    
    if (answer === index && !answerResult.isCorrect) {
      return 'incorrect';
    }
    
    return '';
  };

  if (!currentQuestion) {
    return (
      <div className="container">
        <div className="loading">Memuat pertanyaan...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="quiz-question-container">
        <div className="question-header">
          <h3>
            Pertanyaan {currentQuestion.questionNumber} dari {currentQuestion.totalQuestions}
          </h3>
          <Timer timeLeft={timeLeft} total={currentQuestion.timeLimit} />
        </div>
        
        <div className="question-text">
          <p>{currentQuestion.text}</p>
        </div>
        
        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${getOptionStyle(index)}`}
              onClick={() => handleAnswerSubmit(index)}
              disabled={answer !== null || answerResult !== null}
            >
              {option}
            </button>
          ))}
        </div>
        
        {answerResult && (
          <div className={`answer-result ${answerResult.isCorrect ? 'correct' : 'incorrect'}`}>
            {answerResult.isCorrect
              ? 'Jawaban benar!'
              : 'Jawaban salah!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizQuestion;