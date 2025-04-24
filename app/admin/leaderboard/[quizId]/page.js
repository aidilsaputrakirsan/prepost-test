'use client';

import { useState, useEffect, useCallback } from 'react';
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
  
  // FIXED: Wrap fetchLeaderboardData with useCallback
  const fetchLeaderboardData = useCallback(async () => {
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
  }, [quizId]);
  
  // Validate admin access - FIXED: Added fetchLeaderboardData to dependencies
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    fetchLeaderboardData();
  }, [user, router, quizId, fetchLeaderboardData]);
  
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
    <div className="bg-card p-6 rounded-xl shadow-md border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Hasil Kuis: {quizId}
        </h2>
        <div className="flex space-x-2">
          <Link href={`/admin/control/${quizId}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200">
            Kembali ke Kontrol
          </Link>
          <Link href="/admin/panel" className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition duration-200">
            Panel Admin
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">Ringkasan Kuis</h3>
          <div className="space-y-2 text-gray-300">
            <p><span className="font-medium">Status:</span> {quiz?.status === 'waiting' ? 'Menunggu' : quiz?.status === 'active' ? 'Aktif' : 'Selesai'}</p>
            <p><span className="font-medium">Pertanyaan:</span> {quiz?.questionCount || 0}</p>
            <p><span className="font-medium">Peserta:</span> {quiz?.participantCount || 0}</p>
            {quiz?.startTime && (
              <p><span className="font-medium">Dimulai:</span> {new Date(quiz.startTime).toLocaleString()}</p>
            )}
            {quiz?.endTime && (
              <p><span className="font-medium">Berakhir:</span> {new Date(quiz.endTime).toLocaleString()}</p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-200">Ringkasan Performa</h3>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
              disabled={exportLoading || leaderboard.length === 0}
            >
              {exportLoading ? 'Mengekspor...' : 'Ekspor CSV'}
            </button>
          </div>
          {leaderboard.length > 0 ? (
            <div className="space-y-2 text-gray-300">
              <p><span className="font-medium">Skor Rata-rata:</span> {(leaderboard.reduce((acc, entry) => acc + entry.score, 0) / leaderboard.length).toFixed(2)}</p>
              <p><span className="font-medium">Skor Tertinggi:</span> {Math.max(...leaderboard.map(entry => entry.score))}</p>
              <p><span className="font-medium">Skor Terendah:</span> {Math.min(...leaderboard.map(entry => entry.score))}</p>
              <p><span className="font-medium">Jawaban Benar Rata-rata:</span> {(leaderboard.reduce((acc, entry) => acc + entry.correctAnswers, 0) / leaderboard.length).toFixed(2)}</p>
              <p><span className="font-medium">Waktu Respons Rata-rata:</span> {(leaderboard.reduce((acc, entry) => acc + entry.averageResponseTime, 0) / leaderboard.length / 1000).toFixed(2)} detik</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">Tidak ada hasil tersedia</p>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-200">Papan Peringkat</h3>
        
        {leaderboard.length === 0 ? (
          <div className="bg-indigo-900/20 p-4 rounded-lg text-center border border-indigo-800/40">
            <p className="text-indigo-300">Belum ada hasil yang tersedia. Ini mungkin karena:</p>
            <ul className="list-disc list-inside mt-2 text-gray-300">
              <li>Kuis belum selesai</li>
              <li>Tidak ada peserta yang mengirimkan jawaban</li>
              <li>Terjadi kesalahan saat menghitung hasil</li>
            </ul>
          </div>
        ) : (
          <div className="overflow-x-auto bg-gray-800 rounded-xl border border-gray-700">
            <table className="w-full border-collapse">
              <thead className="bg-gray-750 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Peringkat</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Nama</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Skor</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Jawaban Benar</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Akurasi</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Waktu Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr 
                    key={index}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-gray-750'}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-gray-900 ${
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
                    <td className="px-4 py-3 font-medium text-gray-200">
                      {entry.name}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-200">
                      {entry.score}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {entry.correctAnswers} / {entry.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {((entry.correctAnswers / entry.totalQuestions) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {(entry.averageResponseTime / 1000).toFixed(2)}d
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
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          Kembali ke Kontrol Kuis
        </Link>
      </div>
    </div>
  </div>
);
}