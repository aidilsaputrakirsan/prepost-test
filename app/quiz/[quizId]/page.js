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
  const channelRef = useRef(null);
  const lastTimerValueRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Muat data pengguna saat komponen dimuat
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('quiz_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        console.log("Data pengguna dimuat:", parsedUser.name);
      }
    } catch (e) {
      console.error("Kesalahan memuat data pengguna:", e);
      setError("Kesalahan memuat data pengguna. Silakan muat ulang.");
    }
    
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (questionCheckerIntervalRef.current) clearInterval(questionCheckerIntervalRef.current);
      cleanupPusherConnection();
    };
  }, []);
  
  // Fungsi untuk membersihkan koneksi Pusher
  const cleanupPusherConnection = () => {
    try {
      if (channelRef.current) {
        channelRef.current.unbind('timer-update');
        channelRef.current.unbind('question-sent');
        channelRef.current.unbind('time-up');
        channelRef.current.unbind('next-question');
        channelRef.current.unbind('quiz-stopped');
        channelRef.current.unbind('quiz-ended');
        channelRef.current = null;
      }
      
      if (pusherRef.current) {
        if (quizId) {
          pusherRef.current.unsubscribe(`quiz-${quizId}`);
        }
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      
      lastTimerValueRef.current = null;
    } catch (e) {
      console.error("Kesalahan membersihkan koneksi Pusher:", e);
    }
  };
  
  // Periksa apakah pengguna sudah menjawab pertanyaan saat ini
  useEffect(() => {
    if (!userData || !currentQuestion) return;
    
    try {
      const answeredQuestionsKey = `answered_questions_${quizId}`;
      const answeredQuestions = JSON.parse(localStorage.getItem(answeredQuestionsKey) || '[]');
      const hasAnswered = answeredQuestions.includes(currentQuestion.id);
      
      console.log(`Memeriksa apakah pertanyaan ${currentQuestion.id} telah dijawab:`, hasAnswered);
      
      if (hasAnswered) {
        setHasAnsweredCurrent(true);
        const answerResultKey = `answer_result_${currentQuestion.id}`;
        const savedResult = localStorage.getItem(answerResultKey);
        if (savedResult) {
          setAnswerResult(JSON.parse(savedResult));
        }
      } else {
        setHasAnsweredCurrent(false);
        setAnswerResult(null);
        setSelectedOption(null);
      }
      
      lastQuestionIdRef.current = currentQuestion.id;
    } catch (e) {
      console.error("Kesalahan memeriksa pertanyaan yang dijawab:", e);
    }
  }, [userData, currentQuestion, quizId]);
  
  // Muat pertanyaan saat ini
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        if (!userData) return;
        
        console.log("Mengambil pertanyaan saat ini");
        setLoading(true);
        
        const response = await fetch(`/api/quiz/${quizId}/current-question`, {
          headers: {
            'x-participant-id': userData.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          }
        });
        
        if (response.status === 401) {
          console.error("Kesalahan autentikasi saat mengambil pertanyaan");
          setError("Kesalahan autentikasi. Silakan muat ulang halaman.");
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log("Respon pertanyaan:", data);
        
        if (data.success && data.data) {
          if (isMountedRef.current) {
            setCurrentQuestion(data.data);
            setTimeLeft(data.data.timeLimit);
            setStartTime(Date.now());
            setError('');
            lastTimerValueRef.current = data.data.timeLimit;
          }
        } else {
          if (data.quizStatus === 'selesai') {
            console.log("Kuis selesai, mengalihkan ke hasil");
            localStorage.setItem('quiz_status', 'selesai');
            window.location.href = `/results/${quizId}`;
            return;
          }
          
          if (isMountedRef.current) {
            setError(data.message || "Tidak dapat memuat pertanyaan");
          }
        }
      } catch (err) {
        console.error("Kesalahan mengambil pertanyaan:", err);
        if (isMountedRef.current) {
          setError("Kesalahan jaringan. Silakan muat ulang.");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    if (userData) {
      fetchQuestion();
    }
  }, [quizId, userData]);
  
  // Atur pendengar acara Pusher
  useEffect(() => {
    if (!userData || !quizId) return;
    
    cleanupPusherConnection();
    
    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      
      if (window.Pusher && pusherKey) {
        console.log("Mengatur koneksi Pusher dengan kunci:", pusherKey);
        
        const pusher = new window.Pusher(pusherKey, {
          cluster: pusherCluster || 'eu',
          forceTLS: true
        });
        
        pusherRef.current = pusher;
        
        const channelName = `quiz-${quizId}`;
        console.log("Berlangganan ke saluran:", channelName);
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;
        
        channel.bind('pusher:subscription_succeeded', () => {
          console.log("Berhasil berlangganan ke saluran Pusher");
          
          channel.bind('question-sent', (data) => {
            console.log("Pertanyaan baru diterima melalui Pusher:", data);
            if (isMountedRef.current) {
              handleNewQuestion(data);
            }
          });
          
          channel.bind('timer-update', (data) => {
            if (!isMountedRef.current) return;
            
            const newTimeLeft = data.timeLeft;
            
            if (lastTimerValueRef.current !== null) {
              if (newTimeLeft === lastTimerValueRef.current) {
                return;
              }
              
              if (newTimeLeft > lastTimerValueRef.current && 
                  newTimeLeft !== currentQuestion?.timeLimit) {
                console.log(`Melewati pembaruan pengatur waktu yang mencurigakan: ${newTimeLeft} > ${lastTimerValueRef.current}`);
                return;
              }
            }
            
            console.log(`Pembaruan pengatur waktu: ${newTimeLeft}`);
            lastTimerValueRef.current = newTimeLeft;
            setTimeLeft(newTimeLeft);
          });
          
          channel.bind('time-up', (data) => {
            console.log("Acara waktu habis diterima:", data);
            if (isMountedRef.current) {
              handleTimeUp();
            }
          });
          
          channel.bind('next-question', (data) => {
            console.log("Acara pertanyaan berikutnya diterima:", data);
            if (isMountedRef.current) {
              fetchCurrentQuestion();
            }
          });
          
          channel.bind('quiz-stopped', handleQuizEnd);
          channel.bind('quiz-ended', handleQuizEnd);
        });
        
        channel.bind('pusher:subscription_error', (error) => {
          console.error("Kesalahan berlangganan ke saluran Pusher:", error);
        });
      }
    } catch (err) {
      console.error("Kesalahan mengatur Pusher:", err);
    }
    
    return () => {
      cleanupPusherConnection();
    };
  }, [userData, quizId]);
  
  // Penangan untuk pertanyaan baru
  const handleNewQuestion = (data) => {
    if (!currentQuestion || data.id !== currentQuestion.id) {
      console.log("Pertanyaan berbeda terdeteksi, memperbarui");
      
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
      setStartTime(Date.now());
      setHasAnsweredCurrent(false);
      setAnswerResult(null);
      setSelectedOption(null);
      
      lastTimerValueRef.current = data.timeLimit;
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };
  
  // Penangan untuk acara waktu habis
  const handleTimeUp = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    lastTimerValueRef.current = 0;
    setTimeLeft(0);
    
    if (hasAnsweredCurrent) return;
    
    if (selectedOption !== null) {
      handleAnswerSubmit();
    }
  };
  
  // Penangan untuk acara akhir kuis
  const handleQuizEnd = () => {
    if (!isMountedRef.current) return;
    
    console.log("Acara kuis selesai diterima");
    
    localStorage.setItem('quiz_status', 'selesai');
    window.location.href = `/results/${quizId}`;
  };
  
  // Ambil pertanyaan saat ini dari API
  const fetchCurrentQuestion = async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (!userData) return;

      console.log("Mengambil pertanyaan saat ini");
      
      const response = await fetch(`/api/quiz/${quizId}/current-question`, {
        headers: {
          'x-participant-id': userData.id,
          'x-quiz-id': quizId,
          'x-has-local-storage': 'true'
        }
      });
      
      if (!response.ok) {
        console.error("Gagal mengambil pertanyaan saat ini:", response.status);
        return;
      }
      
      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      if (data.success && data.data) {
        if (!currentQuestion || data.data.id !== currentQuestion.id) {
          console.log("Data pertanyaan baru diterima:", data.data);
          
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          lastTimerValueRef.current = data.data.timeLimit;
          
          setCurrentQuestion(data.data);
          setTimeLeft(data.data.timeLimit);
          setStartTime(Date.now());
          setHasAnsweredCurrent(false);
          setAnswerResult(null);
          setSelectedOption(null);
        }
      } else if (data.quizStatus === 'selesai') {
        console.log("Kuis selesai, mengalihkan ke hasil");
        localStorage.setItem('quiz_status', 'selesai');
        window.location.href = `/results/${quizId}`;
      }
    } catch (err) {
      console.error("Kesalahan mengambil pertanyaan saat ini:", err);
    }
  };
  
  // Atur polling cadangan untuk memeriksa pertanyaan baru
  useEffect(() => {
    if (!userData || !quizId) return;
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    const pollInterval = setInterval(async () => {
      if (!isMountedRef.current) return;
      
      try {
        console.log("Polling untuk status kuis dan pertanyaan saat ini");
        
        const quizResponse = await fetch(`/api/quiz/${quizId}`, {
          headers: {
            'x-participant-id': userData.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          }
        });
        
        if (!isMountedRef.current) return;
        
        if (!quizResponse.ok) {
          console.error("Gagal mengambil status kuis");
          return;
        }
        
        const quizData = await quizResponse.json();
        
        if (quizData.success) {
          if (quizData.data.status === 'selesai') {
            console.log("Polling mendeteksi kuis selesai, mengalihkan...");
            localStorage.setItem('quiz_status', 'selesai');
            window.location.href = `/results/${quizId}`;
            return;
          }
          
          if (quizData.data.status === 'aktif' && currentQuestion && 
              quizData.data.currentQuestionIndex !== undefined) {
            if (currentQuestion.questionNumber - 1 !== quizData.data.currentQuestionIndex) {
              console.log("Polling mendeteksi ketidaksesuaian pertanyaan, mengambil pertanyaan baru");
              fetchCurrentQuestion();
            }
          }
        }
      } catch (err) {
        console.error("Kesalahan selama polling:", err);
      }
    }, 5000);
    
    pollIntervalRef.current = pollInterval;
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userData, quizId, currentQuestion]);
  
  // Periksa setiap beberapa detik apakah pertanyaan baru harus ditampilkan setelah menjawab
  useEffect(() => {
    if (!userData || !quizId) return;
    
    if (questionCheckerIntervalRef.current) {
      clearInterval(questionCheckerIntervalRef.current);
      questionCheckerIntervalRef.current = null;
    }
    
    if (hasAnsweredCurrent && answerResult) {
      console.log("Mengatur pemeriksa pertanyaan setelah jawaban");
      
      const interval = setInterval(async () => {
        if (!isMountedRef.current) return;
        
        try {
          const response = await fetch(`/api/quiz/${quizId}/current-question`, {
            headers: {
              'x-participant-id': userData.id,
              'x-quiz-id': quizId,
              'x-has-local-storage': 'true'
            }
          });
          
          if (!isMountedRef.current) return;
          
          if (!response.ok) return;
          
          const data = await response.json();
          
          if (!data.success && data.quizStatus === 'selesai') {
            console.log("Kuis telah selesai, mengalihkan ke hasil");
            localStorage.setItem('quiz_status', 'selesai');
            window.location.href = `/results/${quizId}`;
            return;
          }
          
          if (data.success && data.data && lastQuestionIdRef.current) {
            if (data.data.id !== lastQuestionIdRef.current) {
              console.log("Pertanyaan baru terdeteksi setelah menjawab, memperbarui UI");
              
              clearInterval(questionCheckerIntervalRef.current);
              questionCheckerIntervalRef.current = null;
              
              lastTimerValueRef.current = data.data.timeLimit;
              
              setCurrentQuestion(data.data);
              setTimeLeft(data.data.timeLimit);
              setStartTime(Date.now());
              setHasAnsweredCurrent(false);
              setAnswerResult(null);
              setSelectedOption(null);
              
              lastQuestionIdRef.current = data.data.id;
            }
          }
        } catch (err) {
          console.error("Kesalahan memeriksa pertanyaan baru:", err);
        }
      }, 3000);
      
      questionCheckerIntervalRef.current = interval;
      
      return () => {
        if (questionCheckerIntervalRef.current) {
          clearInterval(questionCheckerIntervalRef.current);
          questionCheckerIntervalRef.current = null;
        }
      };
    }
  }, [userData, quizId, hasAnsweredCurrent, answerResult]);
  
  // Penanganan pemilihan opsi
  const handleOptionSelect = (index) => {
    if (!hasAnsweredCurrent) {
      setSelectedOption(index);
    }
  };
  
  // Kirim jawaban
  const handleAnswerSubmit = async () => {
    if (selectedOption === null) {
      setError('Silakan pilih jawaban!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!hasAnsweredCurrent && startTime && currentQuestion) {
      try {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        const responseTime = Date.now() - startTime;
        
        if (!userData || !userData.id) {
          console.error("Data pengguna hilang untuk pengiriman jawaban");
          setError("Data autentikasi hilang. Silakan muat ulang.");
          return;
        }
        
        console.log("Mengirim jawaban:", {
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
        
        console.log("Status pengiriman jawaban:", response.status);
        
        if (!isMountedRef.current) return;
        
        if (response.status === 401) {
          console.error("Kesalahan autentikasi saat mengirim jawaban");
          setError("Kesalahan autentikasi. Silakan muat ulang halaman.");
          return;
        }
        
        const data = await response.json();
        console.log("Respon jawaban:", data);
        
        if (data.success) {
          try {
            const answeredQuestionsKey = `answered_questions_${quizId}`;
            const answeredQuestions = JSON.parse(localStorage.getItem(answeredQuestionsKey) || '[]');
            
            if (!answeredQuestions.includes(currentQuestion.id)) {
              answeredQuestions.push(currentQuestion.id);
              localStorage.setItem(answeredQuestionsKey, JSON.stringify(answeredQuestions));
            }
            
            const answerResultKey = `answer_result_${currentQuestion.id}`;
            localStorage.setItem(answerResultKey, JSON.stringify(data.data));
          } catch (e) {
            console.error("Kesalahan menyimpan pertanyaan yang dijawab:", e);
          }
          
          setHasAnsweredCurrent(true);
          setAnswerResult(data.data);
          
          triggerAutoAdvanceCheck();
        } else {
          setError(data.message || "Gagal mengirim jawaban");
        }
      } catch (err) {
        console.error("Kesalahan mengirim jawaban:", err);
        setError("Kesalahan jaringan. Silakan coba lagi.");
      }
    }
  };
  
  // Picu pemeriksaan kemajuan otomatis
  const triggerAutoAdvanceCheck = async () => {
    try {
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
      
      if (!response.ok) {
        console.error("Gagal memicu pemeriksaan kemajuan otomatis:", response.status);
        return;
      }
      
      console.log("Pemeriksaan kemajuan otomatis dipicu");
    } catch (err) {
      console.error("Kesalahan memicu pemeriksaan kemajuan otomatis:", err);
    }
  };
  
  // Ke halaman hasil
  const goToResults = () => {
    localStorage.setItem('quiz_status', 'selesai');
    window.location.href = `/results/${quizId}`;
  };

  // Keadaan pemuatan
  if (loading && !currentQuestion) {
    return <Loading message="Memuat kuis..." />;
  }
  
  // Keadaan kesalahan
  if (!currentQuestion || error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-800">
        <div className="max-w-2xl mx-auto bg-card p-6 rounded-2xl shadow-md border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Informasi Kuis
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border-l-4 border-red-500 text-red-400">
              <p><strong>Kesalahan:</strong> {error}</p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <p className="text-gray-200">Tidak ada pertanyaan yang tersedia saat ini. Halaman akan otomatis diperbarui saat pertanyaan berikutnya siap.</p>
            <p className="text-sm text-gray-400 mt-2">Jika Anda tidak melihat pertanyaan dalam waktu dekat, silakan tunggu atau periksa koneksi Anda.</p>
          </div>
          
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-500 text-gray-200 rounded-lg font-medium hover:bg-indigo-600 transition duration-200"
            >
              Muat Ulang Halaman
            </button>
            
            <button
              onClick={goToResults}
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg font-medium hover:bg-gray-500 transition duration-200"
            >
              Ke Halaman Hasil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan pertanyaan
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-800">
      <div className="max-w-2xl mx-auto bg-card p-6 rounded-2xl shadow-md border border-gray-700">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 text-gray-200">
            Pertanyaan {currentQuestion.questionNumber} dari {currentQuestion.totalQuestions}
          </h3>
          
          {!hasAnsweredCurrent && (
            <Timer timeLeft={timeLeft} total={currentQuestion.timeLimit} />
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-400 rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
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
        
        {!hasAnsweredCurrent && (
          <button 
            onClick={handleAnswerSubmit}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedOption === null}
          >
            Kirim Jawaban
          </button>
        )}
        
        {hasAnsweredCurrent && answerResult && (
          <div className="mt-6">
            <div className="mb-6 bg-gray-800 p-6 border border-gray-700 rounded-lg text-center">
              <h3 className="text-xl font-bold text-indigo-400 mb-2">Terima Kasih Atas Jawaban Anda</h3>
              <p className="text-gray-400 mb-4">
                {currentQuestion.questionNumber === currentQuestion.totalQuestions 
                  ? "Ini adalah pertanyaan terakhir! Anda akan dialihkan ke halaman hasil sebentar lagi." 
                  : "Jawaban Anda telah dicatat. Halaman akan otomatis diperbarui ketika pertanyaan berikutnya siap."}
              </p>
              
              <div className={`p-4 rounded-lg text-center mb-4 ${
                answerResult.isCorrect 
                  ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' 
                  : 'bg-red-900/20 text-red-400 border border-red-900/50'
              }`}>
                <p className="text-lg font-bold mb-1">
                  {answerResult.isCorrect
                    ? '✓ Jawaban Benar!'
                    : '✗ Jawaban Salah!'}
                </p>
                <p>
                  Jawaban yang benar adalah: 
                  <strong className="ml-1">
                    {String.fromCharCode(65 + answerResult.correctOption)} - {currentQuestion.options[answerResult.correctOption]}
                  </strong>
                </p>
              </div>
              
              <div className="mt-2 p-3 bg-amber-900/20 border border-amber-900/40 rounded-lg">
                <p className="text-sm text-amber-400">
                  <span className="font-medium">
                    {currentQuestion.questionNumber === currentQuestion.totalQuestions 
                      ? "Menyiapkan hasil..." 
                      : "Menunggu pertanyaan berikutnya..."}
                  </span>
                  <span className="inline-block ml-2 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-full animate-spin"></span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}