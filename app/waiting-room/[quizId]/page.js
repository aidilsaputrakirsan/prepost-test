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
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [localAuthChecked, setLocalAuthChecked] = useState(false);
  const [lastPollTime, setLastPollTime] = useState(0);
  const [brainSpinning, setBrainSpinning] = useState(false);
  const pollIntervalRef = useRef(null);
  const [userData, setUserData] = useState(null);
  
  const motivationalQuotes = [
    "Tarik napas dalam-dalam dan bersiaplah untuk tes ini!",
    "Jangan khawatir, ini hanya kuis. Partisipasi adalah yang terpenting!",
    "Ingat, kuis ini dirancang untuk membantu kamu belajar.",
    "Bersiaplah! Kuis bisa dimulai kapan saja.",
    "Bersiap untuk menunjukkan pengetahuanmu!",
    "Menang atau kalah, yang penting adalah belajar.",
    "Semakin banyak kamu berlatih, semakin baik hasilnya!",
    "Tetap fokus dan percaya pada pengetahuanmu!",
    "Perjalanan belajar sama pentingnya dengan tujuan.",
    "Kerja keras dan persiapanmu akan membuahkan hasil!"
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
          const userData = JSON.parse(storedUser);
          setUserData(userData);
          
          // Check if localStorage says we're finished - if so, redirect to results
          if (storedStatus === 'finished') {
            console.log("Quiz is finished according to localStorage, redirecting to results page");
            router.push(`/results/${quizId}`);
            return;
          } else if (storedStatus === 'active') {
            console.log("Quiz is active according to localStorage, redirecting to quiz page");
            router.push(`/quiz/${quizId}`);
            return;
          }
          
          // Make sure we only check once to avoid loops
          if (!localAuthChecked) {
            setLocalAuthChecked(true);
            
            // Apply auth headers for future requests
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
      setUserData(user);
      setLocalAuthChecked(true);
    }
  }, [user, router, quizId, localAuthChecked]);

  // Check for quiz status in localStorage to prevent loops
  useEffect(() => {
    // Check localStorage first to prevent redirect loops
    const storedStatus = localStorage.getItem('quiz_status');
    console.log("Waiting room - Stored quiz status:", storedStatus);
    
    // If localStorage says we're finished, redirect to results
    if (storedStatus === 'finished') {
      console.log("Quiz marked as finished in localStorage, redirecting to results");
      router.push(`/results/${quizId}`);
      return;
    }
    
    // Only redirect for definitive active status
    if (quizStatus === 'active') {
      console.log("Quiz status is active, redirecting to quiz page");
      router.push(`/quiz/${quizId}`);
      return;
    }
    
  }, [quizStatus, router, quizId]);
  
  // Join waiting room when authenticated
  useEffect(() => {
    const effectiveUser = user || userData;
    if (effectiveUser && connected && !joined && localAuthChecked) {
      console.log("Joining waiting room with user:", effectiveUser.name);
      joinWaitingRoom(quizId);
      setJoined(true);
      
      // Ensure the user data is in localStorage
      try {
        localStorage.setItem('quiz_user', JSON.stringify(effectiveUser));
        localStorage.setItem('quiz_status', 'waiting');
        localStorage.setItem('quiz_id', quizId);
      } catch (e) {
        console.error("Error storing user data:", e);
      }
    }
  }, [user, userData, quizId, joinWaitingRoom, connected, joined, localAuthChecked]);

  // Function to check quiz status
  const checkQuizStatus = async () => {
    try {
      console.log("Polling for quiz status...");
      setLastPollTime(Date.now());
      setBrainSpinning(true);
      
      // Remove spinning after 1 second
      setTimeout(() => setBrainSpinning(false), 1000);
      
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

  // Set up polling when joined
  useEffect(() => {
    if (!userData || !quizId) return;
    
    // Check for quiz status in localStorage to prevent loops
    const storedStatus = localStorage.getItem('quiz_status');
    
    // If localStorage says we're finished or active, redirect accordingly
    if (storedStatus === 'finished') {
      router.push(`/results/${quizId}`);
      return;
    } else if (storedStatus === 'active') {
      router.push(`/quiz/${quizId}`);
      return;
    }
    
    // Only set up regular polling if we're actually waiting
    if (joined && connected) {
      // Clear any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      console.log("Setting up quiz status polling...");
      
      // Perform an immediate check
      checkQuizStatus();
      
      // Set up new polling interval (every 2 seconds)
      pollIntervalRef.current = setInterval(checkQuizStatus, 2000);
    }
    
    // Clean up on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userData, quizId, joined, connected, router]);

  // Cycle through motivational quotes
  useEffect(() => {
    // Set initial quote
    setCurrentQuote(motivationalQuotes[0]);
    
    // Change quote every 8 seconds
    const interval = setInterval(() => {
      setQuoteIndex(prev => {
        const newIndex = (prev + 1) % motivationalQuotes.length;
        setCurrentQuote(motivationalQuotes[newIndex]);
        return newIndex;
      });
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
    return <Loading message="Loading waiting room..." type="brain" />;
  }

  // Fungsi mendapatkan warna untuk avatar peserta
  const getParticipantColor = (index) => {
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
      'bg-cyan-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Card utama */}
        <div className="bg-card p-6 rounded-2xl shadow-md border border-gray-700 mb-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-900/20 rounded-full opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-900/20 rounded-full opacity-50 blur-2xl"></div>
          
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Ruang Tunggu
            </h2>
            
            {/* Info menunggu quiz dimulai */}
            <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-6 rounded-xl mb-6 text-center shadow-inner border border-indigo-900/30">
              <div className="flex flex-col items-center">
                <div className={`relative mb-4 transform transition-transform duration-500 ${brainSpinning ? 'rotate-180' : ''}`}>
                  <span className="text-5xl animate-float">🧠</span>
                  {/* Decorative pulsing dots */}
                  <span className="absolute top-0 right-0 w-3 h-3 bg-indigo-400 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></span>
                  <span className="absolute bottom-0 left-0 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-75" style={{ animationDuration: '1.5s' }}></span>
                </div>
                
                <p className="text-xl mb-4 font-medium text-indigo-300">
                  Menunggu admin memulai kuis...
                </p>
                
                <div className="flex justify-center mb-4">
                  <div className="w-8 h-8 border-t-4 border-b-4 border-indigo-400 rounded-full animate-spin"></div>
                </div>
                
                <div className="h-16 flex items-center justify-center">
                  <p className="italic text-gray-300 text-center transition-opacity duration-500 animate-fade-in">
                    {currentQuote}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-xl flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            {/* User info dan tombol leave */}
            <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl mb-6 shadow-sm border border-gray-700">
              <div>
                <p className="flex items-center text-gray-300">
                  <span className="font-medium mr-2">Nama:</span> 
                  <span className="flex items-center">
                    {userData?.name || user?.name} 
                    <span className="ml-2 px-2 py-0.5 bg-indigo-900/50 text-indigo-300 text-xs rounded-full">
                      Anda
                    </span>
                  </span>
                </p>
                <p className="flex items-center text-gray-300 mt-1">
                  <span className="font-medium mr-2">Quiz ID:</span>
                  <span className="font-mono bg-gray-700 px-2 py-0.5 rounded">{quizId}</span>
                </p>
              </div>
              
              <button 
                onClick={handleLeaveRoom}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414A1 1 0 0015.414 7L11 2.586A1 1 0 0010.586 2H4a1 1 0 00-1 1zm9 4a1 1 0 00-1-1H8a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V7z" clipRule="evenodd" />
                </svg>
                Keluar
              </button>
            </div>
          </div>
        </div>
        
        {/* Panel Peserta */}
        <div className="bg-card p-6 rounded-2xl shadow-md border border-gray-700 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Peserta ({participants.length})
          </h3>
          
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="italic text-center">
                Belum ada peserta yang bergabung...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto shadow-inner border border-gray-700">
              {participants.map((participant, index) => {
                const isCurrentUser = (userData?.id === participant._id) || (user?.id === participant._id);
                return (
                  <div 
                    key={participant._id || index} 
                    className={`p-3 bg-gray-750 rounded-xl shadow-sm transform transition-all duration-300 hover:scale-105 
                               ${isCurrentUser ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'}`}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white font-bold shadow-sm ${getParticipantColor(index)}`}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate font-medium text-gray-200">
                          {participant.name}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-indigo-400">Anda</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Panel Instruksi */}
        <div className="bg-card p-6 rounded-2xl shadow-md border border-gray-700 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Instruksi
          </h3>
          
          <div className="bg-emerald-900/20 p-4 rounded-xl shadow-inner border border-emerald-900/30">
            <h4 className="font-semibold mb-3 text-emerald-300">Panduan Kuis:</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Tunggu admin memulai kuis</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Siapkan diri untuk menjawab pertanyaan</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Setiap pertanyaan memiliki batas waktu - jawab dengan cepat namun teliti</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">Skor Anda bergantung pada jawaban benar dan kecepatan menjawab</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="text-center">
          <Link 
            href="/" 
            className="btn-secondary"
          >
            Kembali ke Beranda
          </Link>
          
          {/* Tombol refresh manual */}
          <button
            onClick={checkQuizStatus}
            className="mt-4 px-4 py-2 bg-indigo-900/30 text-indigo-300 text-sm rounded-lg hover:bg-indigo-800/30 transition duration-200 focus:outline-none border border-indigo-800/60"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}