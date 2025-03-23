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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Quiz Participants: {quizId}</h2>
          <div className="flex space-x-2">
            <Link href={`/admin/control/${quizId}`} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200">
              Quiz Control
            </Link>
            <Link href="/admin/panel" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200">
              Back to Panel
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
            <p>{success}</p>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">Participants ({participants.length})</h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading participants...</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-blue-600">No participants have joined this quiz yet.</p>
              <p className="mt-2">Share the quiz ID with participants to join.</p>
              <div className="mt-4 p-3 bg-gray-100 rounded flex justify-between items-center">
                <span className="font-mono">{quizId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(quizId);
                    setSuccess('Quiz ID copied to clipboard!');
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition duration-200"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Score</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                        {participant._id}
                      </td>
                      <td className="px-4 py-3">
                        {participant.name}
                      </td>
                      <td className="px-4 py-3">
                        {participant.score || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveParticipant(participant._id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition duration-200"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Join Instructions</h3>
          <p className="mb-3">
            Participants can join this quiz by:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Going to the application homepage</li>
            <li>Entering the Quiz ID: <span className="font-mono font-medium">{quizId}</span></li>
            <li>Providing their name</li>
          </ol>
          <p className="mt-3">
            Alternatively, share this direct link:
          </p>
          <div className="mt-2 p-3 bg-gray-100 rounded flex justify-between items-center">
            <span className="font-mono text-sm overflow-x-auto">
              {typeof window !== 'undefined' ? `${window.location.origin}/join/${quizId}` : `/join/${quizId}`}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${quizId}`);
                setSuccess('Join link copied to clipboard!');
              }}
              className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition duration-200"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}