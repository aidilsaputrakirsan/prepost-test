'use client';

import { useState, useEffect } from 'react';
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
  
  // Validate admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    fetchQuestions();
  }, [user, router, quizId, fetchQuestions]);
  
  // Fetch existing questions
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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Quiz Questions: {quizId}</h2>
          <Link href="/admin/panel" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200">
            Back to Panel
          </Link>
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
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Add New Question</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="questionText" className="block mb-2 font-medium">
                Question Text
              </label>
              <textarea
                id="questionText"
                rows="3"
                value={newQuestion.text}
                onChange={handleTextChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your question here..."
                disabled={submitting}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">
                Options (select the correct answer)
              </label>
              
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={newQuestion.correctOption === index}
                    onChange={() => handleCorrectOptionChange(index)}
                    className="mr-2"
                    disabled={submitting}
                  />
                  
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-grow px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${index + 1}`}
                    disabled={submitting}
                  />
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    disabled={newQuestion.options.length <= 2 || submitting}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                disabled={newQuestion.options.length >= 6 || submitting}
              >
                Add Option
              </button>
            </div>
            
            <div className="mb-6">
              <label htmlFor="timeLimit" className="block mb-2 font-medium">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                id="timeLimit"
                min="5"
                max="60"
                value={newQuestion.timeLimit}
                onChange={handleTimeLimitChange}
                className="w-24 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Question'}
            </button>
          </form>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Questions ({questions.length})</h3>
            
            <button
              onClick={handleSaveAndContinue}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 disabled:opacity-50"
              disabled={loading || questions.length === 0}
            >
              Continue to Quiz Control
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">
              No questions added yet. Add your first question above.
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between">
                    <h4 className="font-medium mb-2">Question {index + 1}</h4>
                    <span className="text-gray-600 text-sm">Time: {question.timeLimit}s</span>
                  </div>
                  
                  <p className="mb-3">{question.text}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex}
                        className={`p-2 rounded ${
                          optIndex === question.correctOption
                            ? 'bg-green-100 border border-green-300'
                            : 'bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span className="font-mono">{String.fromCharCode(65 + optIndex)}.</span> {option}
                        {optIndex === question.correctOption && (
                          <span className="ml-2 text-green-600 text-sm">(Correct)</span>
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