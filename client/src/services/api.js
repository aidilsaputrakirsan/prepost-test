// client/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to request if available
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
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
    return response.data;
  } catch (error) {
    console.error('Get participants error:', error);
    throw error;
  }
};

// Quiz API
export const createQuiz = async () => {
  try {
    const response = await api.post('/quiz');
    return response.data;
  } catch (error) {
    console.error('Create quiz error:', error);
    throw error;
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Get quiz error:', error);
    throw error;
  }
};

export const addQuestions = async (quizId, questions) => {
  try {
    const response = await api.post(`/quiz/${quizId}/questions`, { questions });
    return response.data;
  } catch (error) {
    console.error('Add questions error:', error);
    throw error;
  }
};

export const getQuizQuestions = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}/questions`);
    return response.data;
  } catch (error) {
    console.error('Get questions error:', error);
    throw error;
  }
};

export const getCurrentQuestion = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}/current-question`);
    return response.data;
  } catch (error) {
    console.error('Get current question error:', error);
    throw error;
  }
};

export const getLeaderboard = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error('Get leaderboard error:', error);
    throw error;
  }
};

export default api;