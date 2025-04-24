'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function CreateQuestion() {
  // Use useParams hook to access route parameters client-side
  const params = useParams();
  const quizId = params.quizId;
  
  const { user } = useAuth();
  const router = useRouter();
  
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', ''],
    correctOption: 0,
    timeLimit: 15
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Define fetchQuestions with useCallback BEFORE using it in useEffect
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/quiz/${quizId}/questions`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.data || []);
      } else {
        setError(data.message || 'Failed to load questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. Please try again.');
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
    
    fetchQuestions();
  }, [user, router, quizId, fetchQuestions]);
  
  // Handle text input change
  const handleTextChange = (e) => {
    setNewQuestion({ ...newQuestion, text: e.target.value });
  };
  
  // Handle option change
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };
  
  // Handle correct option change
  const handleCorrectOptionChange = (index) => {
    setNewQuestion({ ...newQuestion, correctOption: index });
  };
  
  // Handle time limit change
  const handleTimeLimitChange = (e) => {
    const value = parseInt(e.target.value) || 15;
    setNewQuestion({ ...newQuestion, timeLimit: Math.max(5, Math.min(60, value)) });
  };
  
  // Add option
  const handleAddOption = () => {
    if (newQuestion.options.length < 6) {
      setNewQuestion({
        ...newQuestion,
        options: [...newQuestion.options, '']
      });
    } else {
      setError('Maximum of 6 options allowed');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Remove option
  const handleRemoveOption = (index) => {
    if (newQuestion.options.length > 2) {
      const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
      
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions,
        correctOption: newQuestion.correctOption >= index
          ? Math.max(0, newQuestion.correctOption - 1)
          : newQuestion.correctOption
      });
    } else {
      setError('Minimum of 2 options required');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Submit question
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate question
    if (!newQuestion.text.trim()) {
      setError('Question text is required');
      return;
    }
    
    // Validate options
    if (newQuestion.options.some(option => !option.trim())) {
      setError('All options must be filled');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await fetch(`/api/quiz/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questions: [newQuestion] })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Question added successfully!');
        
        // Reset form
        setNewQuestion({
          text: '',
          options: ['', ''],
          correctOption: 0,
          timeLimit: 15
        });
        
        // Refresh questions list
        fetchQuestions();
      } else {
        setError(data.message || 'Failed to add question');
      }
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Failed to add question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Submit and navigate to control panel
  const handleSaveAndContinue = async () => {
    if (questions.length === 0) {
      setError('Add at least one question before continuing');
      return;
    }
    
    router.push(`/admin/control/${quizId}`);
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
          Pertanyaan Kuis: {quizId}
        </h2>
        <Link href="/admin/panel" className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition duration-200">
          Kembali ke Panel
        </Link>
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
      
      <div className="mb-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-gray-200">Tambah Pertanyaan Baru</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="questionText" className="block mb-2 font-medium text-gray-300">
              Teks Pertanyaan
            </label>
            <textarea
              id="questionText"
              rows="3"
              value={newQuestion.text}
              onChange={handleTextChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200"
              placeholder="Masukkan pertanyaan di sini..."
              disabled={submitting}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-300">
              Opsi (pilih jawaban yang benar)
            </label>
            
            {newQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={newQuestion.correctOption === index}
                  onChange={() => handleCorrectOptionChange(index)}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 bg-gray-700 border-gray-600"
                  disabled={submitting}
                />
                
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200"
                  placeholder={`Opsi ${index + 1}`}
                  disabled={submitting}
                />
                
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="ml-2 text-red-400 hover:text-red-300"
                  disabled={newQuestion.options.length <= 2 || submitting}
                >
                  Hapus
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-2 px-3 py-1 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition duration-200 disabled:opacity-50"
              disabled={newQuestion.options.length >= 6 || submitting}
            >
              Tambah Opsi
            </button>
          </div>
          
          <div className="mb-6">
            <label htmlFor="timeLimit" className="block mb-2 font-medium text-gray-300">
              Batas Waktu (detik)
            </label>
            <input
              type="number"
              id="timeLimit"
              min="5"
              max="60"
              value={newQuestion.timeLimit}
              onChange={handleTimeLimitChange}
              className="w-24 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200"
              disabled={submitting}
            />
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Menambahkan...' : 'Tambah Pertanyaan'}
          </button>
        </form>
      </div>
      
      <div className="mb-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-200">Pertanyaan ({questions.length})</h3>
          
          <button
            onClick={handleSaveAndContinue}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
            disabled={loading || questions.length === 0}
          >
            Lanjut ke Kontrol Kuis
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-300">Memuat pertanyaan...</span>
          </div>
        ) : questions.length === 0 ? (
          <p className="text-gray-400 py-4 text-center">
            Belum ada pertanyaan. Tambahkan pertanyaan pertama Anda di atas.
          </p>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question._id} className="p-4 bg-gray-750 rounded-lg border border-gray-700">
                <div className="flex justify-between">
                  <h4 className="font-medium mb-2 text-gray-200">Pertanyaan {index + 1}</h4>
                  <span className="text-gray-400 text-sm">Waktu: {question.timeLimit}d</span>
                </div>
                
                <p className="mb-3 text-gray-300">{question.text}</p>
                
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex}
                      className={`p-2 rounded border ${
                        optIndex === question.correctOption
                          ? 'bg-green-900/20 border-green-700 text-green-300'
                          : 'bg-gray-800 border-gray-700 text-gray-300'
                      }`}
                    >
                      <span className="font-mono">{String.fromCharCode(65 + optIndex)}.</span> {option}
                      {optIndex === question.correctOption && (
                        <span className="ml-2 text-green-400 text-sm">(Benar)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}