'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Timer from '@/app/components/common/Timer';
import Loading from '@/app/components/common/Loading';

export default function QuizQuestion() {
  const params = useParams();
  const quizId = params.quizId;
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userData, setUserData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timerIntervalRef = useRef(null);
  
  // Load user data once on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('quiz_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        console.log("User data loaded:", parsedUser.name);
      }
    } catch (e) {
      console.error("Error loading user data:", e);
      setError("Error loading user data. Please refresh.");
    }
  }, []);
  
  // Check if user has already answered the current question
  useEffect(() => {
    if (!userData || !currentQuestion) return;
    
    // Check localStorage for answered questions
    try {
      const answeredQuestionsKey = `answered_questions_${quizId}`;
      const answeredQuestions = JSON.parse(localStorage.getItem(answeredQuestionsKey) || '[]');
      
      // Check if current question is in the answered list
      const hasAnswered = answeredQuestions.includes(currentQuestion.id);
      
      console.log(`Checking if question ${currentQuestion.id} was answered:`, hasAnswered);
      
      if (hasAnswered) {
        setHasAnsweredCurrent(true);
        // Try to load previous answer result
        const answerResultKey = `answer_result_${currentQuestion.id}`;
        const savedResult = localStorage.getItem(answerResultKey);
        if (savedResult) {
          setAnswerResult(JSON.parse(savedResult));
        }
      }
    } catch (e) {
      console.error("Error checking answered questions:", e);
    }
  }, [userData, currentQuestion, quizId]);
  
  // Load current question once
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        if (!userData) return;
        
        console.log("Fetching current question");
        setLoading(true);
        
        const response = await fetch(`/api/quiz/${quizId}/current-question`, {
          headers: {
            'x-participant-id': userData.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          }
        });
        
        if (response.status === 401) {
          console.error("Authentication error when fetching question");
          setError("Authentication error. Please try reloading the page.");
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log("Question response:", data);
        
        if (data.success && data.data) {
          setCurrentQuestion(data.data);
          setTimeLeft(data.data.timeLimit);
          setStartTime(Date.now());
          setError('');
        } else {
          if (data.quizStatus === 'finished') {
            console.log("Quiz is finished, redirecting to results");
            localStorage.setItem('quiz_status', 'finished');
            window.location.href = `/results/${quizId}`;
            return;
          }
          
          setError(data.message || "Could not load question");
        }
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Network error. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    
    if (userData) {
      fetchQuestion();
    }
  }, [quizId, userData]);
  
  // Timer functionality
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Only start timer if we have a question, haven't answered, and not viewing previous answer
    if (currentQuestion && timeLeft > 0 && !hasAnsweredCurrent) {
      console.log("Starting timer with", timeLeft, "seconds");
      
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          if (newTime <= 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            
            // Auto-submit if an option is selected
            if (selectedOption !== null) {
              handleAnswerSubmit();
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentQuestion, hasAnsweredCurrent, selectedOption, timeLeft]);
  
  // Handle option selection
  const handleOptionSelect = (index) => {
    if (!hasAnsweredCurrent) {
      setSelectedOption(index);
    }
  };
  
  // Submit answer
  const handleAnswerSubmit = async () => {
    if (selectedOption === null) {
      setError('Please select an answer!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!hasAnsweredCurrent && startTime && currentQuestion) {
      try {
        // Stop timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        const responseTime = Date.now() - startTime;
        
        // Validate user data
        if (!userData || !userData.id) {
          console.error("Missing user data for answer submission");
          setError("Authentication data missing. Please reload.");
          return;
        }
        
        console.log("Submitting answer:", {
          quizId,
          questionId: currentQuestion.id,
          selectedOption,
          responseTime
        });
        
        const response = await fetch('/api/quiz/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-participant-id': userData.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          },
          body: JSON.stringify({
            quizId,
            questionId: currentQuestion.id,
            selectedOption,
            responseTime
          })
        });
        
        console.log("Answer submission status:", response.status);
        
        if (response.status === 401) {
          console.error("Authentication error when submitting answer");
          setError("Authentication error. Please reload the page.");
          return;
        }
        
        const data = await response.json();
        console.log("Answer response:", data);
        
        if (data.success) {
          // Mark question as answered
          try {
            const answeredQuestionsKey = `answered_questions_${quizId}`;
            const answeredQuestions = JSON.parse(localStorage.getItem(answeredQuestionsKey) || '[]');
            
            // Add current question to answered list if not already there
            if (!answeredQuestions.includes(currentQuestion.id)) {
              answeredQuestions.push(currentQuestion.id);
              localStorage.setItem(answeredQuestionsKey, JSON.stringify(answeredQuestions));
            }
            
            // Save answer result
            const answerResultKey = `answer_result_${currentQuestion.id}`;
            localStorage.setItem(answerResultKey, JSON.stringify(data.data));
          } catch (e) {
            console.error("Error saving answered questions:", e);
          }
          
          setHasAnsweredCurrent(true);
          setAnswerResult(data.data);
        } else {
          setError(data.message || "Failed to submit answer");
        }
      } catch (err) {
        console.error("Error submitting answer:", err);
        setError("Network error. Please try again.");
      }
    }
  };
  
  // Option style based on selection/answer
  const getOptionStyle = (index) => {
    // Base styles
    let styles = "p-4 border-2 rounded-lg flex items-center transition duration-200 mb-3 cursor-pointer";
    
    // If answer result received
    if (answerResult) {
      if (index === answerResult.correctOption) {
        return `${styles} border-green-500 bg-green-50 text-green-800`;
      }
      
      if (answerResult.selectedOption === index && !answerResult.isCorrect) {
        return `${styles} border-red-500 bg-red-50 text-red-800`;
      }
      
      return `${styles} border-gray-200 bg-white text-gray-500`;
    }
    
    // If option is selected but not submitted
    return selectedOption === index 
      ? `${styles} border-blue-500 bg-blue-50 hover:bg-blue-100` 
      : `${styles} border-gray-200 bg-white hover:bg-gray-50`;
  };
  
  // Go to results page
  const goToResults = () => {
    localStorage.setItem('quiz_status', 'finished');
    window.location.href = `/results/${quizId}`;
  };

  // Basic loading state
  if (loading && !currentQuestion) {
    return <Loading message="Loading quiz..." />;
  }
  
  // Error state
  if (!currentQuestion || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Information</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <p>No question is currently available. Please wait for the admin to start the quiz or move to the next question.</p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 mx-2"
            >
              Refresh Page
            </button>
            
            <button
              onClick={goToResults}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200 mx-2"
            >
              Go to Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question view - changes based on whether user has answered or not
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">
            Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
          </h3>
          
          {/* Only show timer if not answered yet */}
          {!hasAnsweredCurrent && (
            <Timer timeLeft={timeLeft} total={currentQuestion.timeLimit} />
          )}
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
        
        {/* Show submit button only if not answered yet */}
        {!hasAnsweredCurrent && (
          <button 
            onClick={handleAnswerSubmit}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedOption === null}
          >
            Submit Answer
          </button>
        )}
        
        {/* Thank you message and answer result when answered */}
        {hasAnsweredCurrent && answerResult && (
          <div className="mt-6">
            <div className="mb-6 bg-blue-50 p-6 border border-blue-100 rounded-lg text-center">
              <h3 className="text-xl font-bold text-blue-800 mb-2">Thank You For Your Answer</h3>
              <p className="text-blue-600 mb-4">Your answer has been recorded. Please wait for the next question.</p>
              
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
              
              <p className="text-sm text-gray-500 mt-4">
                When the admin moves to the next question or ends the quiz, this page will automatically update.
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 mx-2"
              >
                Refresh Page
              </button>
              
              <button
                onClick={goToResults}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200 mx-2"
              >
                View Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}