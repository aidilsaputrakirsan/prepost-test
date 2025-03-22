'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Timer from '@/app/components/common/Timer';
import Loading from '@/app/components/common/Loading';

export default function QuizQuestion() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
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
  const [isReady, setIsReady] = useState(false);
  const questionRef = useRef(null);

  // Set error if context has one
  useEffect(() => {
    if (quizError) {
      setError(quizError);
    }
  }, [quizError]);

  // Enhanced auth check with direct question fetching
  useEffect(() => {
    if (!user) {
      console.log("No user found in context, checking localStorage");
      
      try {
        const storedUser = localStorage.getItem('quiz_user');
        const storedStatus = localStorage.getItem('quiz_status');
        const storedQuizId = localStorage.getItem('quiz_id');
        
        if (storedUser && storedQuizId === quizId) {
          console.log("Found stored user data, applying auth headers");
          const userData = JSON.parse(storedUser);
          
          // Apply auth headers for future requests
          const originalFetch = window.fetch;
          window.fetch = function(url, options = {}) {
            // Create a new options object if none exists
            options = options || {};
            
            // Safely handle headers
            let headers = {};
            
            if (options.headers) {
              if (options.headers instanceof Headers) {
                // Convert Headers object to plain object
                for (const [key, value] of options.headers.entries()) {
                  headers[key] = value;
                }
              } else {
                headers = { ...options.headers };
              }
            }
            
            // Add our authentication headers
            headers['x-participant-id'] = userData.id;
            headers['x-quiz-id'] = quizId;
            headers['x-has-local-storage'] = 'true';
            
            // Update the options object
            options.headers = headers;
            
            // Call the original fetch with modified options
            return originalFetch(url, options);
          };
          
          // If quiz is active, try to fetch current question directly
          if (storedStatus === 'active') {
            fetch(`/api/quiz/${quizId}/current-question`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.data) {
                  // We have a question, quiz is indeed active
                  console.log("Successfully fetched current question");
                  setIsReady(true);
                } else {
                  // No question available, redirect to waiting room
                  console.log("No active question found");
                  router.push(`/waiting-room/${quizId}`);
                }
              })
              .catch(err => {
                console.error("Error fetching question:", err);
                router.push(`/waiting-room/${quizId}`);
              });
          } else {
            // Not active, redirect based on stored status
            if (storedStatus === 'waiting') {
              router.push(`/waiting-room/${quizId}`);
            } else if (storedStatus === 'finished') {
              router.push(`/results/${quizId}`);
            } else {
              router.push(`/join/${quizId}`);
            }
          }
        } else {
          // No valid auth data for this quiz
          router.push(`/join/${quizId}`);
        }
      } catch (e) {
        console.error("localStorage check error:", e);
        router.push(`/join/${quizId}`);
      }
    } else {
      // We have user in context, mark as ready
      setIsReady(true);
      
      // Still redirect based on quiz status
      if (quizStatus === 'waiting') {
        router.push(`/waiting-room/${quizId}`);
      } else if (quizStatus === 'finished') {
        router.push(`/results/${quizId}`);
      }
    }
  }, [user, quizId, router, quizStatus]);

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

  if (!isReady) {
    return <Loading message="Connecting to quiz..." />;
  }

  if (!currentQuestion) {
    return <Loading message="Waiting for question..." />;
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