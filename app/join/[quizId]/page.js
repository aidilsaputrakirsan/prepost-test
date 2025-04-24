'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function JoinQuiz() {
  const params = useParams();
  const quizId = params.quizId;
  
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { createParticipant } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nama diperlukan');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await createParticipant(name, quizId);
      
      if (result.success) {
        router.push(`/waiting-room/${quizId}`);
      } else {
        setError(result.message || 'Gagal bergabung dengan kuis');
      }
    } catch (err) {
      console.error('Kesalahan bergabung dengan kuis:', err);
      setError('Terjadi kesalahan tak terduga. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-800">
      <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Masukkan Nama Anda
        </h2>
        <p className="text-center text-gray-400 mb-6">Untuk bergabung dengan kuis: {quizId}</p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-900/50 text-red-400 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-indigo-500 text-gray-200 py-3 rounded-lg text-lg font-medium hover:bg-indigo-600 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sedang Bergabung...' : 'Gabung Kuis'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition duration-200">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}