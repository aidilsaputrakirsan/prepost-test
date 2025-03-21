'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Timer from '@/app/components/common/Timer';
import Loading from '@/app/components/common/Loading';

export default function QuizQuestion({ params }) {
  const { quizId } = params;
  const { user } = useAuth();
  const {
    currentQuestion,
    timeLeft,
    quizStatus,
    answer,
    answerResult,
    submitAnswer,
    error: quizError
  } = useQuiz();
  
  const router = useRouter();
  const [startTime, setStartTime] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [animation, setAnimation] = useState({});
  const [error, setError] = useState('');
  const questionRef = useRef(null);

  // Set error if context has one
  useEffect(() => {
    if (quizError) {
      setError(quizError);
    }
  }, [quizError]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push(`/join/${quizId}`);
      return;
    }

    if (quizStatus === 'waiting') {
      router.push(`/waiting-room/${quizId}`);
    } else if (quizStatus === 'finished') {
      router.push(`/results/${quizId}`);
    }
  }, [user, quizStatus, router, quizId]);

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
      setError('Please select an answer!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!answer && !answerResult && startTime) {
      const responseTime = Date.now() - startTime;
      submitAnswer(
        quizId,
        currentQuestion.id,
        selectedOption,
        responseTime
      );
    }
  };

  // Get option style based on answer status
  const getOptionStyle = (index) => {
    // Base styles
    let styles = "p-4 border-2 rounded-lg flex items-center transition duration-200 mb-3 cursor-pointer";
    
    // If answer result received
    if (answerResult) {
      if (index === answerResult.correctOption) {
        return `${styles} border-green-500 bg-green-50 text-green-800`;
      }
      
      if (answer === index && !answerResult.isCorrect) {
        return `${styles} border-red-500 bg-red-50 text-red-800`;
      }
      
      return `${styles} border-gray-200 bg-white text-gray-500`;
    }
    
    // If answer submitted but no result yet
    if (answer !== null) {
      return answer === index ? `${styles} border-blue-500 bg-blue-50` : `${styles} border-gray-200 bg-white`;
    }
    
    // If option is selected but not submitted
    return selectedOption === index 
      ? `${styles} border-blue-500 bg-blue-50 hover:bg-blue-100` 
      : `${styles} border-gray-200 bg-white hover:bg-gray-50`;
  };

  if (!currentQuestion) {
    return <Loading message="Loading question..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div 
        ref={questionRef} 
        className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md"
        style={animation}
      >
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">
            Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
          </h3>
          <Timer timeLeft={timeLeft} total={currentQuestion.timeLimit} />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <p className="text-lg font-medium mb-6">{currentQuestion.text}</p>
          
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={getOptionStyle(index)}
                onClick={() => handleOptionSelect(index)}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
        
        {!answer && !answerResult && (
          <button 
            onClick={handleAnswerSubmit}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedOption === null}
          >
            Submit Answer
          </button>
        )}
        
        {answerResult && (
          <div className={`p-4 rounded-lg text-center mb-4 ${
            answerResult.isCorrect 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="text-lg font-bold mb-1">
              {answerResult.isCorrect
                ? '✓ Correct answer!'
                : '✗ Incorrect answer!'}
            </p>
            <p>
              The correct answer is: 
              <strong className="ml-1">
                {String.fromCharCode(65 + answerResult.correctOption)} - {currentQuestion.options[answerResult.correctOption]}
              </strong>
            </p>
          </div>
        )}
        
        <div className={`text-center text-gray-500 mt-4 transition-opacity duration-300 ${
          answerResult ? 'opacity-100' : 'opacity-0'
        }`}>
          <p>Waiting for the next question...</p>
          <div className="mt-2 flex justify-center">
            <div className="w-6 h-6 border-t-2 border-b-2 border-gray-300 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
}