// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser'); // Remove invalid data
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Make sure token exists before storing
    if (!userData || !userData.token) {
      console.error('No token found in user data:', userData);
      return;
    }
    
    // Store user data in context and localStorage
    setCurrentUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    console.log('User logged in:', userData.name);
  };

  const logout = () => {
    // Clear user data
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    console.log('User logged out');
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;