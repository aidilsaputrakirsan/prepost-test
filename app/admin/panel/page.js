// app/(admin)/panel/page.js
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-2xl font-bold mb-4 md:mb-0">Admin Panel</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p>Welcome, {user?.name || "Admin"}</p>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
        
        {success && (
          <div className="mb-6 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-8">
          {showCustomId ? (
            <div className="mb-4">
              <input
                type="text"
                value={customQuizId}
                onChange={(e) => setCustomQuizId(e.target.value)}
                placeholder="Enter quiz ID (optional)"
                className="w-full sm:w-auto px-4 py-2 mb-2 sm:mb-0 mr-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateQuiz}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Quiz'}
                </button>
                <button
                  onClick={() => setShowCustomId(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomId(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Create New Quiz'}
            </button>
          )}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Quizzes</h3>
          
          {loading && quizzes.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading quizzes...</span>
            </div>
          ) : quizzes.length === 0 ? (
            <p className="text-gray-600 py-4">No quizzes yet. Create a new quiz to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quiz ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Participants</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quizzes.map((quiz) => (
                    <tr key={quiz._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{quiz._id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(quiz.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          quiz.status === 'waiting' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : quiz.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {quiz.status === 'waiting'
                            ? 'Waiting'
                            : quiz.status === 'active'
                            ? 'Active'
                            : 'Finished'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {quiz.participantCount || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/create-question/${quiz._id}`}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition duration-200"
                          >
                            Questions
                          </Link>
                          <Link
                            href={`/admin/participants/${quiz._id}`}
                            className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 transition duration-200"
                          >
                            Participants
                          </Link>
                          <Link
                            href={`/admin/control/${quiz._id}`}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition duration-200"
                          >
                            Control
                          </Link>
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