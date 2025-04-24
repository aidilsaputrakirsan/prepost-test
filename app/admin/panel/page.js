// app/admin/panel/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customQuizId, setCustomQuizId] = useState('');
  const [showCustomId, setShowCustomId] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  // Load quizzes when component mounts
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    fetchQuizzes();
  }, [user, router]);

  // Fetch quizzes from API
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/quiz');
      const data = await response.json();
      
      if (data.success) {
        setQuizzes(data.data || []);
      } else {
        setError(data.message || 'Failed to load quizzes');
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new quiz
  const handleCreateQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      
      const quizId = customQuizId.trim() || `quiz${Math.floor(Math.random() * 10000)}`;
      
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quizId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQuizzes([...quizzes, data.data]);
        setSuccess(`Quiz created successfully with ID: ${data.data._id}`);
        
        // Navigate to question creation page
        setTimeout(() => {
          router.push(`/admin/create-question/${data.data._id}`);
        }, 1000);
      } else {
        setError(data.message || 'Failed to create quiz. Try again.');
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Failed to create quiz. Please try again with a different ID.');
    } finally {
      setLoading(false);
      setCustomQuizId('');
      setShowCustomId(false);
    }
  };
  
  // Delete a quiz
  const handleDeleteQuiz = async (quizId) => {
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete quiz ${quizId}? This will permanently delete all questions, answers, and participant data for this quiz.`)) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      setError('');
      
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update quizzes state by removing the deleted quiz
        setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
        setSuccess(`Quiz ${quizId} deleted successfully!`);
      } else {
        setError(data.message || 'Failed to delete quiz. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setError('Failed to delete quiz. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-card p-6 rounded-xl shadow-md border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-2xl font-bold mb-4 md:mb-0 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Panel Admin
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-gray-300">Selamat datang, {user?.name || "Admin"}</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
            >
              Keluar
            </button>
          </div>
        </div>
        
        {success && (
          <div className="mb-6 p-3 bg-green-900/20 text-green-400 rounded-lg border border-green-900/40 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-red-900/20 text-red-400 rounded-lg border border-red-900/40 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <div className="mb-8">
          {showCustomId ? (
            <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <input
                type="text"
                value={customQuizId}
                onChange={(e) => setCustomQuizId(e.target.value)}
                placeholder="Masukkan ID kuis (opsional)"
                className="input mb-3 w-full sm:w-auto"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateQuiz}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Membuat...' : 'Buat Kuis'}
                </button>
                <button
                  onClick={() => setShowCustomId(false)}
                  className="btn-secondary"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomId(true)}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Memuat...' : 'Buat Kuis Baru'}
            </button>
          )}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-200">Kuis Anda</h3>
          
          {loading && quizzes.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="ml-2 text-gray-300">Memuat kuis...</span>
            </div>
          ) : quizzes.length === 0 ? (
            <p className="text-gray-400 py-4 text-center bg-gray-800 rounded-lg border border-gray-700">Belum ada kuis. Buat kuis baru untuk memulai.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">ID Kuis</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">Dibuat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">Peserta</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {quizzes.map((quiz) => (
                    <tr key={quiz._id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-200">{quiz._id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                        {new Date(quiz.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                          quiz.status === 'waiting' 
                            ? 'bg-yellow-900/30 text-yellow-400' 
                            : quiz.status === 'active'
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-gray-800 text-gray-300'
                        }`}>
                          {quiz.status === 'waiting'
                            ? 'Menunggu'
                            : quiz.status === 'active'
                            ? 'Aktif'
                            : 'Selesai'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                        {quiz.participantCount || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/create-question/${quiz._id}`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Pertanyaan
                          </Link>
                          <Link
                            href={`/admin/participants/${quiz._id}`}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Peserta
                          </Link>
                          <Link
                            href={`/admin/control/${quiz._id}`}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Kontrol
                          </Link>
                          {quiz.status === 'finished' && (
                            <Link
                              href={`/admin/leaderboard/${quiz._id}`}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                            >
                              Hasil
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteQuiz(quiz._id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                            disabled={deleteLoading}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}