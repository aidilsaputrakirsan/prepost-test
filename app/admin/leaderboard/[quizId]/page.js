'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import Loading from '@/app/components/common/Loading';

export default function AdminLeaderboard() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const router = useRouter();
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  
  // Validate admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    fetchLeaderboardData();
  }, [user, router, quizId]);
  
  // Fetch leaderboard data
  const fetchLeaderboardData = async () => {
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
      
      // Fetch leaderboard
      const leaderboardResponse = await fetch(`/api/quiz/${quizId}/leaderboard`);
      const leaderboardData = await leaderboardResponse.json();
      
      if (leaderboardData.success) {
        setLeaderboard(leaderboardData.data.entries || []);
      } else {
        setError(leaderboardData.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Export leaderboard as CSV
  const handleExportCSV = () => {
    try {
      setExportLoading(true);
      
      if (!leaderboard || leaderboard.length === 0) {
        setError('No data to export');
        return;
      }
      
      // Create CSV headers
      const headers = ['Rank', 'Name', 'Score', 'Correct Answers', 'Total Questions', 'Avg Response Time (sec)'];
      
      // Create CSV rows
      const rows = leaderboard.map((entry, index) => [
        index + 1,
        entry.name,
        entry.score,
        entry.correctAnswers,
        entry.totalQuestions,
        (entry.averageResponseTime / 1000).toFixed(2)
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quiz-${quizId}-results.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportLoading(false);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV. Please try again.');
      setExportLoading(false);
    }
  };
  
  // Clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  if (loading) {
    return <Loading message="Loading leaderboard..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Quiz Results: {quizId}</h2>
          <div className="flex space-x-2">
            <Link href={`/admin/control/${quizId}`} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200">
              Back to Control
            </Link>
            <Link href="/admin/panel" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200">
              Admin Panel
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Quiz Summary</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {quiz?.status || 'Unknown'}</p>
              <p><span className="font-medium">Questions:</span> {quiz?.questionCount || 0}</p>
              <p><span className="font-medium">Participants:</span> {quiz?.participantCount || 0}</p>
              {quiz?.startTime && (
                <p><span className="font-medium">Started:</span> {new Date(quiz.startTime).toLocaleString()}</p>
              )}
              {quiz?.endTime && (
                <p><span className="font-medium">Ended:</span> {new Date(quiz.endTime).toLocaleString()}</p>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg col-span-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Performance Summary</h3>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition duration-200 disabled:opacity-50"
                disabled={exportLoading || leaderboard.length === 0}
              >
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                <p><span className="font-medium">Average Score:</span> {(leaderboard.reduce((acc, entry) => acc + entry.score, 0) / leaderboard.length).toFixed(2)}</p>
                <p><span className="font-medium">Highest Score:</span> {Math.max(...leaderboard.map(entry => entry.score))}</p>
                <p><span className="font-medium">Lowest Score:</span> {Math.min(...leaderboard.map(entry => entry.score))}</p>
                <p><span className="font-medium">Average Correct Answers:</span> {(leaderboard.reduce((acc, entry) => acc + entry.correctAnswers, 0) / leaderboard.length).toFixed(2)}</p>
                <p><span className="font-medium">Average Response Time:</span> {(leaderboard.reduce((acc, entry) => acc + entry.averageResponseTime, 0) / leaderboard.length / 1000).toFixed(2)} seconds</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No results available</p>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Leaderboard</h3>
          
          {leaderboard.length === 0 ? (
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-blue-600">No results available yet. This could be because:</p>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                <li>The quiz hasn't finished yet</li>
                <li>No participants submitted any answers</li>
                <li>There was an error calculating the results</li>
              </ul>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Score</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Correct Answers</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Accuracy</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Avg Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={index}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-white ${
                              index === 0 ? 'bg-yellow-400' : 
                              index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                            }`}>
                              {index + 1}
                            </span>
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {entry.name}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {entry.score}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.correctAnswers} / {entry.totalQuestions}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {((entry.correctAnswers / entry.totalQuestions) * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(entry.averageResponseTime / 1000).toFixed(2)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <Link
            href={`/admin/control/${quizId}`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
          >
            Back to Quiz Control
          </Link>
        </div>
      </div>
    </div>
  );
}