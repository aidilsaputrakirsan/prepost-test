'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Timer from '@/app/components/common/Timer';
import Loading from '@/app/components/common/Loading';
import QuizCard from '@/app/components/quiz/QuizCard';

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
  const pollIntervalRef = useRef(null);
  const questionCheckerIntervalRef = useRef(null);
  const lastQuestionIdRef = useRef(null);
  const pusherRef = useRef(null);
  
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
      } else {
        // Reset answer state for new question
        setHasAnsweredCurrent(false);
        setAnswerResult(null);
        setSelectedOption(null);
      }
      
      // Update last question ID reference
      lastQuestionIdRef.current = currentQuestion.id;
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
  
  // Set up Pusher event listening
  useEffect(() => {
    if (!userData || !quizId) return;
    
    // Clean up any existing Pusher connection
    if (pusherRef.current) {
      try {
        const existingChannel = pusherRef.current.channel(`quiz-${quizId}`);
        if (existingChannel) {
          existingChannel.unbind_all();
          pusherRef.current.unsubscribe(`quiz-${quizId}`);
        }
      } catch (e) {
        console.error("Error cleaning up Pusher:", e);
      }
    }
    
    // Set up Pusher
    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      
      if (window.Pusher && pusherKey) {
        const pusher = new window.Pusher(pusherKey, {
          cluster: pusherCluster || 'eu'
        });
        
        pusherRef.current = pusher;
        const channel = pusher.subscribe(`quiz-${quizId}`);
        
        // Listen for new questions - IMPROVED EVENT HANDLING
        channel.bind('question-sent', (data) => {
          console.log("New question received via Pusher:", data);
          
          // Check if this is a different question
          if (!currentQuestion || data.id !== currentQuestion.id) {
            console.log("Different question detected, updating");
            
            // Update question data
            setCurrentQuestion(data);
            setTimeLeft(data.timeLimit);
            setStartTime(Date.now());
            setHasAnsweredCurrent(false);
            setAnswerResult(null);
            setSelectedOption(null);
            
            // Clear any existing intervals
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
          }
        });
        
        // Listen for timer updates
        channel.bind('timer-update', (data) => {
          setTimeLeft(data.timeLeft);
        });
        
        // Listen for time-up event (specific for Vercel compatibility)
        channel.bind('time-up', async (data) => {
          console.log("Time up event received:", data);
          
          // If we've already answered, help trigger auto-advance
          if (hasAnsweredCurrent) {
            console.log("Time up and already answered, helping with auto-advancement");
            
            // Instead of trying to trigger auto-advance ourselves, we'll
            // just prepare for the next question which will come from the server
            setTimeLeft(0);
          } else {
            // If time is up and we haven't answered, just wait for the next question
            console.log("Time up but haven't answered, waiting for next question");
            setTimeLeft(0);
            
            // Clear interval if it's still running
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
          }
        });
        
        // Listen for the next-question event - NEW EVENT
        channel.bind('next-question', (data) => {
          console.log("Next question event received:", data);
          
          // This is a new, dedicated event for next question
          if (data && data.questionId && (!currentQuestion || data.questionId !== currentQuestion.id)) {
            // Refresh the question data
            console.log("Fetching next question data");
            fetchCurrentQuestion();
          }
        });
        
        // Event to handle last question being reached
        const handleQuizEnd = () => {
          console.log("Quiz ended event received");
          // Store quiz status as finished
          localStorage.setItem('quiz_status', 'finished');
          
          // Redirect to results page
          window.location.href = `/results/${quizId}`;
        };
        
        // Listen for quiz end
        channel.bind('quiz-stopped', handleQuizEnd);
        channel.bind('quiz-ended', handleQuizEnd);
        
        // Clean up on unmount
        return () => {
          if (channel) {
            channel.unbind_all();
          }
          if (pusher) {
            pusher.unsubscribe(`quiz-${quizId}`);
          }
        };
      }
    } catch (err) {
      console.error("Error setting up Pusher:", err);
    }
  }, [userData, quizId, currentQuestion, hasAnsweredCurrent]);
  
  // Fetch the current question from the API
  const fetchCurrentQuestion = async () => {
    try {
      if (!userData) return;

      console.log("Fetching current question");
      
      const response = await fetch(`/api/quiz/${quizId}/current-question`, {
        headers: {
          'x-participant-id': userData.id,
          'x-quiz-id': quizId,
          'x-has-local-storage': 'true'
        }
      });
      
      if (!response.ok) {
        console.error("Failed to fetch current question:", response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Check if this is a new question
        if (!currentQuestion || data.data.id !== currentQuestion.id) {
          console.log("New question data received:", data.data);
          setCurrentQuestion(data.data);
          setTimeLeft(data.data.timeLimit);
          setStartTime(Date.now());
          setHasAnsweredCurrent(false);
          setAnswerResult(null);
          setSelectedOption(null);
          
          // Clear any existing intervals
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        }
      } else if (data.quizStatus === 'finished') {
        // If quiz is finished, redirect to results
        console.log("Quiz is finished, redirecting to results");
        localStorage.setItem('quiz_status', 'finished');
        window.location.href = `/results/${quizId}`;
      }
    } catch (err) {
      console.error("Error fetching current question:", err);
    }
  };
  
  // Set up fallback polling to check for new questions
  useEffect(() => {
    if (!userData || !quizId) return;
    
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Set up polling at a regular interval (every 5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        console.log("Polling for quiz status and current question");
        
        // First check the quiz status
        const quizResponse = await fetch(`/api/quiz/${quizId}`, {
          headers: {
            'x-participant-id': userData.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          }
        });
        
        if (!quizResponse.ok) {
          console.error("Failed to fetch quiz status");
          return;
        }
        
        const quizData = await quizResponse.json();
        
        if (quizData.success) {
          // Check if quiz is finished
          if (quizData.data.status === 'finished') {
            console.log("Poll detected finished quiz, redirecting...");
            localStorage.setItem('quiz_status', 'finished');
            window.location.href = `/results/${quizId}`;
            return;
          }
          
          // If active, check current question
          if (quizData.data.status === 'active') {
            // Check if we need current question data
            if (!currentQuestion || 
                (quizData.data.currentQuestionIndex !== undefined && 
                 currentQuestion.questionNumber - 1 !== quizData.data.currentQuestionIndex)) {
              console.log("Poll detected potential new question, fetching...");
              fetchCurrentQuestion();
            }
          }
        }
      } catch (err) {
        console.error("Error during poll:", err);
      }
    }, 5000);
    
    pollIntervalRef.current = pollInterval;
    
    // Clean up on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userData, quizId, currentQuestion]);
  
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
            } else {
              // If time runs out and no answer selected, trigger a check for new question
              setTimeout(() => {
                console.log("Time ran out with no answer, checking for new question");
                fetchCurrentQuestion();
              }, 2000);
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
  
  // Check every few seconds if a new question should be shown after answering
  useEffect(() => {
    if (!userData || !quizId) return;
    
    // Only set up this checker if user has already answered
    if (hasAnsweredCurrent && answerResult) {
      // Clear any existing interval
      if (questionCheckerIntervalRef.current) {
        clearInterval(questionCheckerIntervalRef.current);
      }
      
      console.log("Setting up post-answer question checker");
      
      // Check every 3 seconds if there's a new question
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/quiz/${quizId}/current-question`, {
            headers: {
              'x-participant-id': userData.id,
              'x-quiz-id': quizId,
              'x-has-local-storage': 'true'
            }
          });
          
          if (!response.ok) return;
          
          const data = await response.json();
          
          // If quiz is finished, redirect to results
          if (!data.success && data.quizStatus === 'finished') {
            console.log("Quiz has finished, redirecting to results");
            localStorage.setItem('quiz_status', 'finished');
            window.location.href = `/results/${quizId}`;
            return;
          }
          
          // Check if we have a new question
          if (data.success && data.data && lastQuestionIdRef.current) {
            if (data.data.id !== lastQuestionIdRef.current) {
              console.log("New question detected after answering, updating UI");
              setCurrentQuestion(data.data);
              setTimeLeft(data.data.timeLimit);
              setStartTime(Date.now());
              setHasAnsweredCurrent(false);
              setAnswerResult(null);
              setSelectedOption(null);
              
              // Update last question ID reference
              lastQuestionIdRef.current = data.data.id;
            }
          }
        } catch (err) {
          console.error("Error checking for new question:", err);
        }
      }, 3000);
      
      questionCheckerIntervalRef.current = interval;
      
      return () => {
        if (questionCheckerIntervalRef.current) {
          clearInterval(questionCheckerIntervalRef.current);
        }
      };
    }
  }, [userData, quizId, hasAnsweredCurrent, answerResult]);
  
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
          
          // IMPROVED: Try to trigger auto-advance for other participants
          triggerAutoAdvanceCheck();
        } else {
          setError(data.message || "Failed to submit answer");
        }
      } catch (err) {
        console.error("Error submitting answer:", err);
        setError("Network error. Please try again.");
      }
    }
  };
  
  // NEW: Function to trigger auto-advance check
  const triggerAutoAdvanceCheck = async () => {
    try {
      // This endpoint will check if all participants have answered and should move to next question
      const response = await fetch(`/api/quiz/${quizId}/check-all-answered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participant-id': userData.id,
          'x-quiz-id': quizId,
          'x-has-local-storage': 'true'
        },
        body: JSON.stringify({
          questionId: currentQuestion.id
        })
      });
      
      // Note: we don't need to handle the response here, as the server will
      // broadcast to all clients if it decides to advance to the next question
      console.log("Auto-advance check triggered:", response.status);
    } catch (err) {
      console.error("Error triggering auto-advance check:", err);
    }
  };
  
  // Function to fetch and check for next question
  const fetchNextQuestion = async () => {
    try {
      // First check if this was the last question
      if (currentQuestion && currentQuestion.questionNumber === currentQuestion.totalQuestions) {
        console.log("Last question answered, checking if quiz is finished");
        
        // Check quiz status directly
        const quizResponse = await fetch(`/api/quiz/${quizId}`, {
          headers: {
            'x-participant-id': userData.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          }
        });
        
        if (quizResponse.ok) {
          const quizData = await quizResponse.json();
          
          if (quizData.success && quizData.data.status === 'finished') {
            console.log("Last question answered and quiz is finished, redirecting to results");
            localStorage.setItem('quiz_status', 'finished');
            window.location.href = `/results/${quizId}`;
            return;
          } else {
            // Even if not yet marked as finished, wait for admin to end quiz
            console.log("Last question answered, waiting for quiz to be marked as finished");
            
            // Set a bit longer delay for the next check to avoid spamming
            setTimeout(() => {
              window.location.href = `/results/${quizId}`;
            }, 5000);
            return;
          }
        }
      }
      
      fetchCurrentQuestion();
    } catch (err) {
      console.error("Error checking for next question:", err);
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
            <p>No question is currently available. The page will automatically refresh when the next question is ready.</p>
            <p className="text-sm text-gray-500 mt-2">If you don't see a question soon, please wait or check your connection.</p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 mx-2"
            >
              Refresh Page Manually
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
        
        <QuizCard
          question={currentQuestion.text}
          options={currentQuestion.options}
          selectedOption={selectedOption}
          correctOption={answerResult ? answerResult.correctOption : null}
          isAnswered={hasAnsweredCurrent}
          onSelect={handleOptionSelect}
        />
        
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
              <p className="text-blue-600 mb-4">
                {currentQuestion.questionNumber === currentQuestion.totalQuestions 
                  ? "This was the last question! You'll be redirected to the results page shortly." 
                  : "Your answer has been recorded. The page will automatically update when the next question is ready."}
              </p>
              
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
              
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">
                    {currentQuestion.questionNumber === currentQuestion.totalQuestions 
                      ? "Preparing results..." 
                      : "Waiting for next question..."}
                  </span>
                  <span className="inline-block ml-2 w-4 h-4 border-t-2 border-r-2 border-yellow-500 rounded-full animate-spin"></span>
                </p>
              </div>
              
              {currentQuestion.questionNumber === currentQuestion.totalQuestions && (
                <div className="mt-4">
                  <button
                    onClick={() => goToResults()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
                  >
                    View Results Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}