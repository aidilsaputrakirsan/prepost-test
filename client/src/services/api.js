// client/src/services/api.js
import axios from 'axios';

// Create API base URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api');

console.log('API URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Add token to request if available
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser'); // Clear invalid data
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('currentUser');
      if (window.location.pathname.includes('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const registerAdmin = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const loginAdmin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// User API
export const createParticipant = async (userData) => {
  try {
    const response = await api.post('/user', userData);
    return response.data;
  } catch (error) {
    console.error('Create participant error:', error);
    throw error;
  }
};

export const getQuizParticipants = async (quizId) => {
  try {
    const response = await api.get(`/user/quiz/${quizId}`);
    return response;
  } catch (error) {
    console.error('Get participants error:', error);
    throw error;
  }
};

// Quiz API
export const createQuiz = async (quizData) => {
  try {
    const response = await api.post('/quiz', quizData);
    return response;
  } catch (error) {
    console.error('Create quiz error:', error);
    throw error;
  }
};
// Get all quizzes (admin)
export const getQuizzes = async () => {
  try {
    const response = await api.get('/quiz');
    return response;
  } catch (error) {
    console.error('Get quizzes error:', error);
    throw error;
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}`);
    return response;
  } catch (error) {
    console.error('Get quiz error:', error);
    throw error;
  }
};

export const addQuestions = async (quizId, questions) => {
  try {
    const response = await api.post(`/quiz/${quizId}/questions`, questions);
    return response;
  } catch (error) {
    console.error('Add questions error:', error);
    throw error;
  }
};

export const getQuizQuestions = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}/questions`);
    return response;
  } catch (error) {
    console.error('Get questions error:', error);
    throw error;
  }
};

export const deleteQuestion = async (quizId, questionId) => {
  try {
    const response = await api.delete(`/quiz/${quizId}/questions/${questionId}`);
    return response;
  } catch (error) {
    console.error('Delete question error:', error);
    throw error;
  }
};

export const getCurrentQuestion = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}/current-question`);
    return response;
  } catch (error) {
    console.error('Get current question error:', error);
    throw error;
  }
};

export const getLeaderboard = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}/leaderboard`);
    return response;
  } catch (error) {
    console.error('Get leaderboard error:', error);
    throw error;
  }
};

export default api;