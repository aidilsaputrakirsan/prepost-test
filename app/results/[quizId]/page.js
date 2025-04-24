'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useQuiz } from '@/app/context/QuizContext';
import Loading from '@/app/components/common/Loading';
import QuestionHistory from '@/app/components/quiz/QuestionHistory';

export default function QuizResults() {
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const { quizStatus, leaderboard, loading, error: quizError } = useQuiz();
  
  const router = useRouter();
  const [userRank, setUserRank] = useState(null);
  const [userEntry, setUserEntry] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [error, setError] = useState('');
  const [answersLoading, setAnswersLoading] = useState(false);
  const [showAnswerHistory, setShowAnswerHistory] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Set error dari konteks
  useEffect(() => {
    if (quizError) {
      setError(quizError);
    }
  }, [quizError]);

  // Muat pengguna dari localStorage jika tidak tersedia dari konteks
  useEffect(() => {
    const checkLocalStorage = () => {
      try {
        const storedUser = localStorage.getItem('quiz_user');
        const storedQuizId = localStorage.getItem('quiz_id');
        
        console.log("Memeriksa localStorage untuk data pengguna");
        
        if (storedUser && storedQuizId === quizId) {
          const userData = JSON.parse(storedUser);
          console.log("Pengguna ditemukan di localStorage:", userData.name);
          setLocalUser(userData);
          
          if (!userData.currentQuiz) {
            userData.currentQuiz = quizId;
            localStorage.setItem('quiz_user', JSON.stringify(userData));
          }
          
          localStorage.setItem('quiz_status', 'selesai');
          
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
          
          return true;
        }
        
        return false;
      } catch (e) {
        console.error("Kesalahan memeriksa localStorage:", e);
        return false;
      }
    };

    if (!user) {
      const hasLocalUser = checkLocalStorage();
      
      if (!hasLocalUser) {
        console.log("Tidak ada pengguna di konteks atau localStorage, mengalihkan ke halaman bergabung");
        router.push(`/join/${quizId}`);
      }
    }
    
    setIsCheckingAuth(false);
  }, [user, router, quizId]);

  // Alihkan berdasarkan status kuis untuk sesi terautentikasi
  useEffect(() => {
    const storedStatus = localStorage.getItem('quiz_status');
    console.log("Halaman hasil - Status kuis tersimpan:", storedStatus);
    
    if (storedStatus === 'selesai') {
      console.log("Kuis ditandai selesai di localStorage, tetap di halaman hasil");
      return;
    }
    
    if (user && quizStatus && quizStatus !== 'selesai' && quizStatus !== null) {
      console.log(`Status kuis dari konteks: ${quizStatus}, mengalihkan sesuai kebutuhan`);
      if (quizStatus === 'menunggu') {
        router.push(`/waiting-room/${quizId}`);
      } else if (quizStatus === 'aktif') {
        router.push(`/quiz/${quizId}`);
      }
    }
  }, [user, quizStatus, router, quizId]);

  // Proses data papan peringkat untuk menemukan entri dan peringkat pengguna
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      const effectiveUser = user || localUser;
      
      if (effectiveUser) {
        const userEntryIndex = leaderboard.findIndex(entry => {
          return (
            (entry.user && entry.user.toString() === effectiveUser.id.toString()) ||
            (entry.userId && entry.userId.toString() === effectiveUser.id.toString())
          );
        });
        
        if (userEntryIndex !== -1) {
          setUserEntry(leaderboard[userEntryIndex]);
          setUserRank(userEntryIndex + 1);
        }
      }
    }
  }, [leaderboard, user, localUser]);
  
  // Ambil jawaban pengguna untuk kuis ini
  useEffect(() => {
    const fetchUserAnswers = async () => {
      const effectiveUser = user || localUser;
      
      if (!effectiveUser || !quizId) return;
      
      try {
        setAnswersLoading(true);
        
        console.log("Mengambil jawaban pengguna dengan ID:", effectiveUser.id);
        
        const response = await fetch(`/api/quiz/${quizId}/user-answers`, {
          headers: {
            'x-participant-id': effectiveUser.id,
            'x-quiz-id': quizId,
            'x-has-local-storage': 'true'
          }
        });
        
        if (!response.ok) {
          console.error("Gagal mengambil jawaban pengguna:", response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log("Jawaban pengguna diambil:", data.data.length);
          setUserAnswers(data.data || []);
        } else {
          console.error("Kesalahan mengambil jawaban:", data.message);
        }
      } catch (error) {
        console.error("Kesalahan mengambil jawaban pengguna:", error);
      } finally {
        setAnswersLoading(false);
      }
    };
    
    if (!isCheckingAuth) {
      fetchUserAnswers();
    }
  }, [user, localUser, quizId, isCheckingAuth]);

  if (isCheckingAuth || loading || answersLoading) {
    return <Loading message="Memuat hasil kuis..." />;
  }

  const effectiveUser = user || localUser;
  
  if (!effectiveUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-card p-6 rounded-2xl shadow-md border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Hasil Kuis
          </h2>
          <p className="mb-6 text-gray-400">Anda perlu bergabung dengan kuis untuk melihat hasil.</p>
          <Link
            href={`/join/${quizId}`}
            className="px-6 py-3 bg-indigo-500 text-gray-200 rounded-lg font-medium hover:bg-indigo-600 transition duration-200"
          >
            Gabung Kuis
          </Link>
        </div>
      </div>
    );
  }

  const displayScore = userEntry ? userEntry.score : effectiveUser?.score || 0;
  
  let correctAnswers = 0;
  let totalQuestions = 0;
  
  if (userEntry) {
    correctAnswers = userEntry.correctAnswers || 0;
    totalQuestions = userEntry.totalQuestions || 0;
  } else if (userAnswers.length > 0) {
    totalQuestions = userAnswers.length;
    correctAnswers = userAnswers.filter(a => a.isCorrect).length;
  } else if (leaderboard && leaderboard.length > 0) {
    totalQuestions = leaderboard[0].totalQuestions || 0;
    if (displayScore > 0) {
      correctAnswers = Math.round(displayScore / 150);
    }
  }
  
  if (displayScore > 200 && correctAnswers === 0) {
    correctAnswers = Math.max(1, Math.floor(displayScore / 150));
  }
  
  if (totalQuestions === 0 && correctAnswers > 0) {
    totalQuestions = Math.max(correctAnswers, 1);
  }

  console.log("Merender hasil dengan pengguna:", effectiveUser.name, "skor:", displayScore);

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-800">
      <div className="max-w-3xl mx-auto bg-card p-6 rounded-2xl shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Hasil Kuis
        </h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 text-red-400 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-gray-800 p-6 rounded-xl mb-8 shadow-sm border border-gray-700">
          <div className="mb-6 pb-6 border-b border-gray-700">
            <h3 className="text-lg text-gray-400 mb-2">Peserta</h3>
            <p className="text-xl font-bold text-gray-200">{effectiveUser.name}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <h4 className="text-sm text-gray-400 mb-1">Total Skor</h4>
              <p className="text-2xl font-bold text-indigo-400">{displayScore}</p>
            </div>
            
            <div className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <h4 className="text-sm text-gray-400 mb-1">Jawaban Benar</h4>
              <p className="text-xl">
                <span className="font-bold text-emerald-400">{correctAnswers}</span>
                <span className="text-gray-400"> / {totalQuestions}</span>
              </p>
            </div>
                    
            {userRank && (
              <div className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
                <h4 className="text-sm text-gray-400 mb-1">Peringkat</h4>
                <p className="text-2xl font-bold text-amber-400">#{userRank}</p>
              </div>
            )}
            
            {userEntry && userEntry.averageResponseTime > 0 && (
              <div className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
                <h4 className="text-sm text-gray-400 mb-1">Rata-rata Waktu</h4>
                <p className="text-xl font-medium text-gray-200">{(userEntry.averageResponseTime / 1000).toFixed(2)} detik</p>
              </div>
            )}
          </div>
          
          {userRank && leaderboard && leaderboard.length > 0 && (
            <div className="p-4 bg-indigo-900/50 rounded-lg mb-4 text-gray-200">
              <p>
                Anda berada di peringkat <strong>#{userRank}</strong> dari {leaderboard.length} peserta
              </p>
            </div>
          )}
          
          <div className="text-center">
            <button
              onClick={() => setShowAnswerHistory(!showAnswerHistory)}
              className="px-4 py-2 bg-indigo-500 text-gray-200 rounded-lg font-medium hover:bg-indigo-600 transition duration-200"
            >
              {showAnswerHistory ? "Sembunyikan Riwayat Jawaban" : "Tampilkan Riwayat Jawaban"}
            </button>
          </div>
        </div>
        
        {showAnswerHistory && (
          <div className="mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-200">
              Riwayat Jawaban Anda
            </h3>
            
            {userAnswers.length === 0 ? (
              <p className="text-center text-gray-400 italic">Tidak ada riwayat jawaban tersedia</p>
            ) : (
              <div className="space-y-4">
                {userAnswers.map((answer, index) => (
                  <QuestionHistory key={answer.answerId || index} answer={answer} />
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={`/leaderboard/${quizId}`}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-gray-200 rounded-lg font-medium transition-colors duration-200 text-center"
          >
            Lihat Papan Peringkat
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg font-medium transition-colors duration-200 text-center"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}