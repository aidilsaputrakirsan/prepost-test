// app/admin/control/[quizId]/page.js - Updated control panel
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Loading from '@/app/components/common/Loading';

export default function QuizControl() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const router = useRouter();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [participantAdvance, setParticipantAdvance] = useState(true); // New setting for participant-based auto-advance
  const [timeLeft, setTimeLeft] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0); // Track how many participants have answered
  
  // Define fetchQuizData with useCallback BEFORE using it in useEffect
  const fetchQuizData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch quiz info
      const quizResponse = await fetch(`/api/quiz/${quizId}`);
      const quizData = await quizResponse.json();
      
      if (!quizData.success) {
        setError(quizData.message || 'Failed to load quiz');
        return;
      }
      
      setQuiz(quizData.data);
      setQuizStatus(quizData.data.status);
      setCurrentQuestionIndex(quizData.data.currentQuestionIndex || 0);
      
      // Fetch questions
      const questionsResponse = await fetch(`/api/quiz/${quizId}/questions`);
      const questionsData = await questionsResponse.json();
      
      if (questionsData.success) {
        setQuestions(questionsData.data || []);
      }
      
      // Fetch participants
      const participantsResponse = await fetch(`/api/user/quiz/${quizId}`);
      const participantsData = await participantsResponse.json();
      
      if (participantsData.success) {
        setParticipants(participantsData.data || []);
      }
      
      // Fetch current question's answer count if quiz is active
      if (quizData.data.status === 'active' && quizData.data.currentQuestionIndex !== undefined) {
        fetchAnswerCount(quizId, quizData.data.currentQuestionIndex);
      }
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quizId]);
  
  // New function to fetch answer count for the current question
  const fetchAnswerCount = async (quizId, questionIndex) => {
    if (questionIndex === undefined || !questions[questionIndex]) return;
    
    try {
      const questionId = questions[questionIndex]._id;
      const response = await fetch(`/api/quiz/${quizId}/answer-count/${questionId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnsweredCount(data.data.answeredCount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching answer count:', err);
    }
  };
  
  // Validate admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    fetchQuizData();
  }, [user, router, quizId, fetchQuizData]);
  
  // Setup Pusher event handler for auto-advancement
  useEffect(() => {
    if (quizStatus === 'active') {
      // Listen for timer-up events which may require admin action
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      
      if (window.Pusher && pusherKey) {
        const pusher = new window.Pusher(pusherKey, {
          cluster: pusherCluster || 'eu'
        });
        
        const adminChannel = pusher.subscribe(`private-admin-${quizId}`);
        const quizChannel = pusher.subscribe(`quiz-${quizId}`);
        
        // Listen for question-time-up event
        adminChannel.bind('question-time-up', async (data) => {
          console.log("Question time up event received:", data);
          
          if (autoAdvance) {
            // Use a slight delay to allow for any last-second answers
            setTimeout(async () => {
              console.log("Auto-advancing to next question");
              try {
                const response = await fetch(`/api/quiz/${quizId}/auto-advance`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    autoAdvanceToken: 'admin-auto-advance'
                  })
                });
                
                if (!response.ok) {
                  console.error("Failed to auto-advance:", response.status);
                  setError('Auto-advancement failed. Try manual advancement.');
                } else {
                  // Refresh quiz data
                  fetchQuizData();
                }
              } catch (err) {
                console.error("Error during auto-advancement:", err);
                setError('Auto-advancement failed. Try manual advancement.');
              }
            }, 5000);
          } else {
            console.log("Auto-advancement disabled, waiting for manual advancement");
          }
        });
        
        // Listen for time-up events from the client
        quizChannel.bind('time-up', (data) => {
          console.log("Time up event from quiz channel:", data);
          setTimeLeft(0);
        });
        
        // Listen for participant answer updates
        quizChannel.bind('participant-answered', (data) => {
          console.log("Participant answered event received:", data);
          setAnsweredCount(data.answeredCount || 0);
          
          // If participant-based auto-advance is enabled
          if (participantAdvance && data.allAnswered) {
            console.log("All participants have answered, auto-advancing");
            
            // Add a slight delay to allow late responses to process
            setTimeout(async () => {
              handleNextQuestion();
            }, 3000);
          }
        });
        
        return () => {
          adminChannel.unbind_all();
          quizChannel.unbind_all();
          pusher.unsubscribe(`private-admin-${quizId}`);
          pusher.unsubscribe(`quiz-${quizId}`);
        };
      }
    }
  }, [quizId, quizStatus, autoAdvance, participantAdvance, fetchQuizData, questions]);
  
  // Start quiz
  const handleStartQuiz = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      // Check if we have questions
      if (questions.length === 0) {
        setError('Cannot start quiz without questions. Please add questions first.');
        return;
      }
      
      // Check if we have participants
      if (participants.length === 0) {
        setError('Cannot start quiz without participants. Please wait for participants to join.');
        return;
      }
      
      const response = await fetch(`/api/quiz/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          autoAdvance,
          participantAdvance // Include the new setting
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQuizStatus('active');
        setSuccess('Quiz started successfully!');
        
        // Refresh quiz data
        fetchQuizData();
      } else {
        setError(data.message || 'Failed to start quiz');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Toggle auto-advance setting
  const handleToggleAutoAdvance = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const newAutoAdvanceValue = !autoAdvance;
      
      const response = await fetch(`/api/quiz/${quizId}/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ autoAdvance: newAutoAdvanceValue })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAutoAdvance(newAutoAdvanceValue);
        setSuccess(`Auto-advancement ${newAutoAdvanceValue ? 'enabled' : 'disabled'} successfully!`);
      } else {
        setError(data.message || 'Failed to update auto-advance setting');
      }
    } catch (err) {
      console.error('Error updating auto-advance setting:', err);
      setError('Failed to update auto-advance setting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Toggle participant-based auto-advance setting
  const handleToggleParticipantAdvance = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const newValue = !participantAdvance;
      
      const response = await fetch(`/api/quiz/${quizId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participantAdvance: newValue })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setParticipantAdvance(newValue);
        setSuccess(`Participant-based auto-advancement ${newValue ? 'enabled' : 'disabled'} successfully!`);
      } else {
        setError(data.message || 'Failed to update participant auto-advance setting');
      }
    } catch (err) {
      console.error('Error updating participant auto-advance setting:', err);
      setError('Failed to update setting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Move to next question
  const handleNextQuestion = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await fetch(`/api/quiz/${quizId}/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setCurrentQuestionIndex(data.data.currentQuestionIndex);
        setAnsweredCount(0); // Reset answered count for the new question
        
        if (data.data.status === 'finished') {
          setQuizStatus('finished');
          setSuccess('Quiz completed successfully!');
        } else {
          setSuccess('Moved to next question successfully!');
        }
        
        // Refresh quiz data
        fetchQuizData();
      } else {
        setError(data.message || 'Failed to move to next question');
      }
    } catch (err) {
      console.error('Error moving to next question:', err);
      setError('Failed to move to next question. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Stop quiz
  const handleStopQuiz = async () => {
    if (!confirm('Are you sure you want to stop the quiz? This will end the quiz for all participants.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      setError('');
      
      const response = await fetch(`/api/quiz/${quizId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQuizStatus('finished');
        setSuccess('Quiz stopped successfully!');
        
        // Refresh quiz data
        fetchQuizData();
      } else {
        setError(data.message || 'Failed to stop quiz');
      }
    } catch (err) {
      console.error('Error stopping quiz:', err);
      setError('Failed to stop quiz. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Remove participant
  const handleRemoveParticipant = async (userId) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/participants/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update participants list
        setParticipants(participants.filter(p => p._id !== userId));
        setSuccess('Participant removed successfully!');
      } else {
        setError(data.message || 'Failed to remove participant');
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      setError('Failed to remove participant. Please try again.');
    }
  };
  
  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);
  
  if (loading) {
    return <Loading message="Loading quiz control panel..." />;
  }

return (
  <div className="container mx-auto px-4 py-8">
    <div className="bg-card p-6 rounded-xl shadow-md border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Kontrol Kuis: {quizId}
        </h2>
        <Link href="/admin/panel" className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition duration-200">
          Kembali ke Panel
        </Link>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-900/20 border-l-4 border-green-500 text-green-400">
          <p>{success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">Status Kuis</h3>
          <div className="flex items-center mb-2">
            <span className="mr-2 text-gray-300">Status Saat Ini:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              quizStatus === 'waiting' 
                ? 'bg-yellow-900/30 text-yellow-400' 
                : quizStatus === 'active' 
                ? 'bg-green-900/30 text-green-400'
                : 'bg-gray-700 text-gray-300'
            }`}>
              {quizStatus === 'waiting'
                ? 'Menunggu'
                : quizStatus === 'active'
                ? 'Aktif'
                : 'Selesai'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {quizStatus === 'waiting' 
              ? 'Menunggu Anda untuk memulai kuis.' 
              : quizStatus === 'active' 
              ? `Saat ini pada pertanyaan ${currentQuestionIndex + 1} dari ${questions.length}.` 
              : 'Kuis telah berakhir.'}
          </p>
          
          {quizStatus === 'active' && (
            <div className="mb-4 p-3 bg-blue-900/20 rounded-lg">
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center">
                  <span className="mr-2 text-gray-300">Otomatis (Waktu):</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    autoAdvance 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {autoAdvance ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className="mr-2 text-gray-300">Otomatis (Peserta):</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    participantAdvance 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {participantAdvance ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              
              {autoAdvance && timeLeft > 0 && (
                <p className="text-sm text-gray-400">
                  Pertanyaan berikutnya dalam: <span className="font-medium">{timeLeft} detik</span>
                </p>
              )}
              
              {participantAdvance && (
                <p className="text-sm text-gray-400">
                  Respons: <span className="font-medium">{answeredCount}</span> dari <span className="font-medium">{participants.length}</span> peserta
                </p>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {quizStatus === 'waiting' && (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoAdvance"
                      checked={autoAdvance}
                      onChange={() => setAutoAdvance(!autoAdvance)}
                      className="mr-2 bg-gray-700 border-gray-600"
                    />
                    <label htmlFor="autoAdvance" className="text-sm text-gray-300">
                      Aktifkan perpindahan otomatis berbasis waktu
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="participantAdvance"
                      checked={participantAdvance}
                      onChange={() => setParticipantAdvance(!participantAdvance)}
                      className="mr-2 bg-gray-700 border-gray-600"
                    />
                    <label htmlFor="participantAdvance" className="text-sm text-gray-300">
                      Lanjut otomatis setelah semua peserta menjawab
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={handleStartQuiz}
                  disabled={actionLoading || questions.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                >
                  {actionLoading ? 'Memulai...' : 'Mulai Kuis'}
                </button>
              </div>
            )}
            
            {quizStatus === 'active' && (
              <>
                <button
                  onClick={handleToggleAutoAdvance}
                  disabled={actionLoading}
                  className={`px-4 py-2 ${autoAdvance ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition duration-200 disabled:opacity-50`}
                >
                  {actionLoading ? 'Memperbarui...' : autoAdvance ? 'Nonaktifkan Otomatis (Waktu)' : 'Aktifkan Otomatis (Waktu)'}
                </button>
                
                <button
                  onClick={handleToggleParticipantAdvance}
                  disabled={actionLoading}
                  className={`px-4 py-2 ${participantAdvance ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition duration-200 disabled:opacity-50`}
                >
                  {actionLoading ? 'Memperbarui...' : participantAdvance ? 'Nonaktifkan Otomatis (Peserta)' : 'Aktifkan Otomatis (Peserta)'}
                </button>
                
                <button
                  onClick={handleNextQuestion}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                >
                  {actionLoading ? 'Memuat...' : 'Pertanyaan Berikutnya'}
                </button>
                
                <button
                  onClick={handleStopQuiz}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50"
                >
                  {actionLoading ? 'Menghentikan...' : 'Hentikan Kuis'}
                </button>
              </>
            )}
            
            {quizStatus === 'finished' && (
              <Link
                href={`/admin/leaderboard/${quizId}`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
              >
                Lihat Hasil
              </Link>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">Peserta ({participants.length})</h3>
          {participants.length === 0 ? (
            <p className="text-sm text-gray-400">
              Belum ada peserta yang bergabung. Bagikan ID Kuis kepada peserta.
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto scrollbar-thin">
              <ul className="divide-y divide-gray-700">
                {participants.map((participant) => (
                  <li key={participant._id} className="py-2 flex justify-between items-center">
                    <span className="text-gray-300">{participant.name}</span>
                    <button
                      onClick={() => handleRemoveParticipant(participant._id)}
                      className="text-red-400 hover:text-red-300"
                      title="Hapus peserta"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">Pertanyaan ({questions.length})</h3>
          {questions.length === 0 ? (
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Belum ada pertanyaan. Tambahkan pertanyaan sebelum memulai kuis.
              </p>
              <Link
                href={`/admin/create-question/${quizId}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Tambah Pertanyaan
              </Link>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto scrollbar-thin">
              <ul className="divide-y divide-gray-700">
                {questions.map((question, index) => (
                  <li 
                    key={question._id} 
                    className={`py-2 ${
                      index === currentQuestionIndex && quizStatus === 'active'
                        ? 'font-medium text-indigo-400'
                        : 'text-gray-300'
                    }`}
                  >
                    <span className="mr-2">{index + 1}.</span>
                    <span>{question.text.length > 30 ? question.text.substring(0, 30) + '...' : question.text}</span>
                    
                    {index === currentQuestionIndex && quizStatus === 'active' && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-900/30 text-indigo-400 text-xs rounded-full">
                        Saat Ini
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg border border-gray-700 mb-6">
        <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Bagikan Kuis
        </h3>
        <p className="mb-3 text-gray-400">
          Bagikan tautan ini kepada peserta untuk bergabung dengan kuis:
        </p>
        <div className="flex">
          <input
            type="text"
            value={`${window.location.origin}/join/${quizId}`}
            readOnly
            className="flex-grow px-4 py-2 border border-gray-700 bg-gray-800 text-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join/${quizId}`);
              setSuccess('Tautan disalin ke clipboard!');
            }}
            className="px-4 py-2 bg-indigo-500 text-gray-200 rounded-r-lg hover:bg-indigo-600 transition duration-200"
          >
            Salin
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          ID Kuis: <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-200">{quizId}</span>
        </p>
      </div>
      
      {quizStatus === 'active' && currentQuestionIndex < questions.length && (
        <div className="bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-900/30">
          <h3 className="text-lg font-semibold mb-3 text-indigo-300">Pertanyaan Saat Ini</h3>
          <div className="mb-3">
            <div className="flex justify-between mb-2">
              <p className="font-medium text-gray-200">{questions[currentQuestionIndex].text}</p>
              <p className="text-sm text-blue-400">
                Respon: <span className="font-bold">{answeredCount}</span> / {participants.length}
              </p>
            </div>
            <ul className="space-y-2">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <li key={index} className={`p-2 border rounded ${
                  index === questions[currentQuestionIndex].correctOption
                    ? 'border-green-700 bg-green-900/20 text-green-300'
                    : 'border-gray-700 bg-gray-750 text-gray-300'
                }`}>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-2 text-sm text-gray-300">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                    {index === questions[currentQuestionIndex].correctOption && (
                      <span className="ml-auto text-green-400 text-sm">Jawaban Benar</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Batas Waktu: {questions[currentQuestionIndex].timeLimit} detik
            </p>
            {autoAdvance && (
              <div className="flex items-center">
                <p className="text-sm text-blue-400 mr-2">
                  Otomatis dalam: <span className="font-bold">{timeLeft}d</span>
                </p>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(timeLeft / questions[currentQuestionIndex].timeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}