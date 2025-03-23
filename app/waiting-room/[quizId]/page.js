'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Loading from '@/app/components/common/Loading';

export default function WaitingRoom() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user, logout } = useAuth();
  const { 
    joinWaitingRoom, 
    quizStatus, 
    participants, 
    error: quizError,
    connected,
    loading
  } = useQuiz();
  
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [currentQuote, setCurrentQuote] = useState('');
  const [localAuthChecked, setLocalAuthChecked] = useState(false);
  const [lastPollTime, setLastPollTime] = useState(0);
  const pollIntervalRef = useRef(null);
  
  const randomQuotes = [
    "Take a deep breath and prepare for this test!",
    "Don't worry, it's just a quiz. Participation is what matters!",
    "Remember, this quiz is designed to help you learn.",
    "Get ready! The quiz may start at any moment.",
    "Prepare to show your knowledge!"
  ];

  // Handle connection status
  useEffect(() => {
    if (!connected) {
      setError('Connecting to server...');
    } else {
      setError('');
    }
  }, [connected]);

  // Set error from quiz context
  useEffect(() => {
    if (quizError) {
      setError(quizError);
    }
  }, [quizError]);

  // Enhanced auth check with localStorage fallback
  useEffect(() => {
    if (!user) {
      console.log("No user found in context, checking localStorage");
      
      // Check localStorage as fallback
      try {
        const storedUser = localStorage.getItem('quiz_user');
        const storedStatus = localStorage.getItem('quiz_status');
        const storedQuizId = localStorage.getItem('quiz_id');
        
        console.log("localStorage check:", {
          user: storedUser ? "Found" : "Not found",
          status: storedStatus,
          quizId: storedQuizId
        });
        
        // If we have valid data in localStorage matching current quiz, use it
        if (storedUser && storedQuizId === quizId) {
          console.log("Found valid user data in localStorage");
          
          // Make sure we only check once to avoid loops
          if (!localAuthChecked) {
            setLocalAuthChecked(true);
            
            // If quiz is active according to localStorage, redirect to quiz page
            if (storedStatus === 'active') {
              console.log("Quiz is active according to localStorage, redirecting to quiz page");
              window.location.href = `/quiz/${quizId}`;
              return;
            } else if (storedStatus === 'finished') {
              console.log("Quiz is finished according to localStorage, redirecting to results page");
              window.location.href = `/results/${quizId}`;
              return;
            }
            
            // Apply auth headers for future requests
            const userData = JSON.parse(storedUser);
            if (typeof window !== 'undefined') {
              const originalFetch = window.fetch;
              window.fetch = function(url, options = {}) {
                options = options || {};
                let headers = {};
                
                if (options.headers) {
                  if (options.headers instanceof Headers) {
                    for (const [key, value] of options.headers.entries()) {
                      headers[key] = value;
                    }
                  } else {
                    headers = { ...options.headers };
                  }
                }
                
                headers['x-participant-id'] = userData.id;
                headers['x-quiz-id'] = quizId;
                headers['x-has-local-storage'] = 'true';
                
                options.headers = headers;
                return originalFetch(url, options);
              };
            }
          }
        } else {
          console.log("No valid auth data for this quiz, redirecting to join");
          router.push(`/join/${quizId}`);
          return;
        }
      } catch (e) {
        console.error("localStorage check error:", e);
        router.push(`/join/${quizId}`);
        return;
      }
    } else {
      setLocalAuthChecked(true);
    }
  }, [user, router, quizId, localAuthChecked]);

  // Join waiting room when authenticated
  useEffect(() => {
    if (user && connected && !joined && localAuthChecked) {
      console.log("Joining waiting room with user:", user.name);
      joinWaitingRoom(quizId);
      setJoined(true);
      
      // Ensure the user data is in localStorage
      try {
        localStorage.setItem('quiz_user', JSON.stringify(user));
        localStorage.setItem('quiz_status', 'waiting');
        localStorage.setItem('quiz_id', quizId);
      } catch (e) {
        console.error("Error storing user data:", e);
      }
    }
  }, [user, quizId, joinWaitingRoom, connected, joined, localAuthChecked]);

  // Aggressive polling mechanism to check quiz status
  useEffect(() => {
    if (!quizId || !localAuthChecked) return;
    
    // Start polling
    const startPolling = () => {
      console.log("Starting quiz status polling...");
      
      // Clear any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      // Perform an immediate check
      checkQuizStatus();
      
      // Set up new polling interval (every 2 seconds)
      pollIntervalRef.current = setInterval(checkQuizStatus, 2000);
    };
    
    // Function to check quiz status
    const checkQuizStatus = async () => {
      try {
        console.log("Polling for quiz status...");
        setLastPollTime(Date.now());
        
        const response = await fetch(`/api/quiz/${quizId}`);
        if (!response.ok) {
          console.error("Failed to fetch quiz status:", response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          const currentStatus = data.data.status;
          console.log(`Polled quiz status: ${currentStatus}`);
          
          if (currentStatus === 'active') {
            console.log("Poll detected active quiz, redirecting...");
            
            // Update localStorage
            localStorage.setItem('quiz_status', 'active');
            
            // IMPORTANT: Use direct window location for most reliable redirect
            window.location.href = `/quiz/${quizId}`;
          } else if (currentStatus === 'finished') {
            console.log("Poll detected finished quiz, redirecting...");
            
            // Update localStorage
            localStorage.setItem('quiz_status', 'finished');
            
            // IMPORTANT: Use direct window location for most reliable redirect
            window.location.href = `/results/${quizId}`;
          }
        }
      } catch (err) {
        console.error("Error polling quiz status:", err);
      }
    };
    
    startPolling();
    
    // Clean up on unmount
    return () => {
      if (pollIntervalRef.current) {
        console.log("Cleaning up quiz status polling");
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [quizId, localAuthChecked]);

  // Redundant check using the Quiz context state (handle Pusher events if they work)
  useEffect(() => {
    if (quizStatus === 'active') {
      console.log("Quiz context detected active quiz, redirecting...");
      
      // Store quiz status before redirect
      try {
        localStorage.setItem('quiz_status', 'active');
      } catch (e) {
        console.error("Error storing quiz status:", e);
      }
      
      // IMPORTANT: Use direct window location for most reliable redirect
      window.location.href = `/quiz/${quizId}`;
    } else if (quizStatus === 'finished') {
      console.log("Quiz context detected finished quiz, redirecting...");
      
      // Store quiz status before redirect
      try {
        localStorage.setItem('quiz_status', 'finished');
      } catch (e) {
        console.error("Error storing quiz status:", e);
      }
      
      // IMPORTANT: Use direct window location for most reliable redirect
      window.location.href = `/results/${quizId}`;
    }
  }, [quizStatus, quizId]);

  // Random quotes
  useEffect(() => {
    // Initial quote
    setCurrentQuote(randomQuotes[Math.floor(Math.random() * randomQuotes.length)]);
    
    // Change quote every 8 seconds
    const interval = setInterval(() => {
      setCurrentQuote(randomQuotes[Math.floor(Math.random() * randomQuotes.length)]);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave the waiting room?')) {
      logout();
      router.push('/');
    }
  };

  // Direct check on component mount
  useEffect(() => {
    // Function to check if quiz is already started
    const checkIfQuizStarted = async () => {
      try {
        const response = await fetch(`/api/quiz/${quizId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.success && data.data.status === 'active') {
          console.log("Initial check found quiz is already active!");
          localStorage.setItem('quiz_status', 'active');
          window.location.href = `/quiz/${quizId}`;
        } else if (data.success && data.data.status === 'finished') {
          console.log("Initial check found quiz is already finished!");
          localStorage.setItem('quiz_status', 'finished');
          window.location.href = `/results/${quizId}`;
        }
      } catch (err) {
        console.error("Error checking quiz status on mount:", err);
      }
    };
    
    if (quizId && localAuthChecked) {
      checkIfQuizStarted();
    }
  }, [quizId, localAuthChecked]);

  if (loading || !localAuthChecked) {
    return <Loading message="Loading waiting room..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Waiting Room</h2>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-6 text-center">
          <p className="text-lg mb-4">Waiting for admin to start the quiz...</p>
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="italic text-gray-600">{currentQuote}</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-6">
          <div>
            <p><span className="font-medium">Name:</span> {user?.name}</p>
            <p><span className="font-medium">Quiz ID:</span> {quizId}</p>
          </div>
          <button 
            onClick={handleLeaveRoom} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
          >
            Leave
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Participants ({participants.length})</h3>
          
          {participants.length === 0 ? (
            <p className="italic text-center text-gray-500 py-4">
              No participants have joined yet...
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              {participants.map((participant, index) => (
                <div 
                  key={participant._id || index} 
                  className={`p-3 bg-white rounded-md shadow-sm flex items-center ${
                    user?.id === participant._id ? 'border-2 border-blue-400' : ''
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: `hsl(${(index * 70) % 360}, 70%, 65%)` }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">
                    {participant.name}
                    {user?.id === participant._id && (
                      <span className="text-xs text-blue-500 ml-1">(You)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Wait for the admin to start the quiz</li>
            <li>Prepare yourself to answer the questions</li>
            <li>Each question has a time limit</li>
            <li>Your score depends on correct answers and answering speed</li>
          </ul>
        </div>
        
        <div className="text-center">
          <Link 
            href="/" 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200"
          >
            Back to Home
          </Link>
        </div>
        
        {/* Manual refresh button for testing */}
        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              try {
                const resp = await fetch(`/api/quiz/${quizId}`);
                const data = await resp.json();
                alert(`Current quiz status: ${data.data.status}`);
              } catch (err) {
                alert(`Error checking status: ${err.message}`);
              }
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition duration-200"
          >
            Check Quiz Status
          </button>
        </div>
      </div>
    </div>
  );
}