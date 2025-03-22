'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function JoinQuiz({ params }) {
  const { quizId } = params;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { createParticipant } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await createParticipant(name, quizId);
      
      if (result.success) {
        router.push(`/waiting-room/${quizId}`);
      } else {
        setError(result.message || 'Failed to join quiz');
      }
    } catch (err) {
      console.error('Join quiz error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Enter Your Name</h2>
        <p className="text-center text-gray-600 mb-6">To join quiz: {quizId}</p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-3 rounded text-lg font-medium hover:bg-blue-600 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Quiz'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-500 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}