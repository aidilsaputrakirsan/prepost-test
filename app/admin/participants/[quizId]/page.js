'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function ParticipantsList() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const router = useRouter();
  
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Define fetchParticipants with useCallback BEFORE using it in useEffect
  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/user/quiz/${quizId}`);
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.data || []);
      } else {
        setError(data.message || 'Failed to load participants');
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quizId]);
  
  // Validate admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    fetchParticipants();
  }, [user, router, quizId, fetchParticipants]);
  
  // Remove participant
  const handleRemoveParticipant = async (participantId) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/quiz/${quizId}/participants/${participantId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Participant removed successfully');
        
        // Update participants list
        setParticipants(participants.filter(p => p._id !== participantId));
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-card p-6 rounded-xl shadow-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Peserta Kuis: {quizId}
          </h2>
          <div className="flex space-x-2">
            <Link href={`/admin/control/${quizId}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200">
              Kontrol Kuis
            </Link>
            <Link href="/admin/panel" className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition duration-200">
              Kembali ke Panel
            </Link>
          </div>
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
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-200">Peserta ({participants.length})</h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="ml-2 text-gray-300">Memuat peserta...</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="bg-indigo-900/20 p-4 rounded-lg text-center border border-indigo-800/50">
              <p className="text-indigo-300">Belum ada peserta yang bergabung dengan kuis ini.</p>
              <p className="mt-2 text-gray-300">Bagikan ID kuis dengan peserta untuk bergabung.</p>
              <div className="mt-4 p-3 bg-gray-800 rounded-lg flex justify-between items-center">
                <span className="font-mono text-gray-300">{quizId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(quizId);
                    setSuccess('ID Kuis disalin ke clipboard!');
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                  Salin
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-gray-800 rounded-xl overflow-hidden">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">Nama</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">Skor</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300 border-b border-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {participants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm text-gray-400">
                        {participant._id}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {participant.name}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {participant.score || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveParticipant(participant._id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition duration-200"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-200">Instruksi Bergabung</h3>
          <p className="mb-3 text-gray-300">
            Peserta dapat bergabung dengan kuis ini melalui:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-300">
            <li>Pergi ke halaman beranda aplikasi</li>
            <li>Masukkan ID Kuis: <span className="font-mono bg-gray-700 px-2 py-0.5 rounded">{quizId}</span></li>
            <li>Memberikan nama mereka</li>
          </ol>
          <p className="mt-3 text-gray-300">
            Atau, bagikan tautan langsung ini:
          </p>
          <div className="mt-2 p-3 bg-gray-700 rounded-lg flex justify-between items-center">
            <span className="font-mono text-sm overflow-x-auto text-gray-200">
              {typeof window !== 'undefined' ? `${window.location.origin}/join/${quizId}` : `/join/${quizId}`}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${quizId}`);
                setSuccess('Tautan bergabung disalin ke clipboard!');
              }}
              className="ml-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              Salin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}