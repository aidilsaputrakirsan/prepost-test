// app/context/AuthContext.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize user state from session or localStorage
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      // If session exists, use that for user data
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        isAdmin: session.user.isAdmin,
        currentQuiz: session.user.currentQuiz,
        score: session.user.score
      });
    } else {
      // Otherwise, try to get user data from localStorage (for participants)
      try {
        const storedUser = localStorage.getItem('quiz_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Add a custom header to all future requests to indicate locally stored auth
          if (typeof window !== 'undefined') {
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
              options.headers = options.headers || {};
              options.headers['x-has-local-storage'] = 'true';
              return originalFetch(url, options);
            };
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error retrieving stored user:', e);
        setUser(null);
      }
    }

    setLoading(false);
  }, [session, status]);

  // Login function
  const login = async (email, password) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (result.error) {
        return {
          success: false,
          message: result.error
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Registration failed'
        };
      }

      // Auto login after registration
      if (data.success) {
        await login(userData.email, userData.password);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  };

  // Create participant function (for joining quiz)
  const createParticipant = async (name, quizId) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, quizId })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to join quiz'
        };
      }
  
      // Set user data locally
      const userData = {
        id: data.data._id,
        name: data.data.name,
        currentQuiz: data.data.currentQuiz,
        score: data.data.score,
        isAdmin: false
      };
      
      // Update context
      setUser(userData);
      
      // Enhanced localStorage storage
      try {
        // Save user data
        localStorage.setItem('quiz_user', JSON.stringify(userData));
        
        // Save quiz status
        localStorage.setItem('quiz_status', 'waiting');
        localStorage.setItem('quiz_id', quizId);
        
        console.log("User and quiz data stored in localStorage");
        
        // Add a custom header to all future XHR requests
        if (typeof window !== 'undefined') {
          const originalFetch = window.fetch;
          window.fetch = function(url, options = {}) {
            options.headers = options.headers || {};
            options.headers['x-participant-id'] = userData.id;
            options.headers['x-quiz-id'] = quizId;
            options.headers['x-has-local-storage'] = 'true';
            return originalFetch(url, options);
          };
        }
      } catch (e) {
        console.error("Error storing user data:", e);
      }
  
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Join quiz error:', error);
      return {
        success: false,
        message: error.message || 'Failed to join quiz'
      };
    }
  };

  // Logout function
  const logout = async () => {
    // Clear participant data from localStorage
    try {
      localStorage.removeItem('quiz_user');
    } catch (e) {
      console.error('Error clearing stored user:', e);
    }
    
    // Sign out from NextAuth if using it
    if (session) {
      await signOut({ redirect: false });
    }
    
    // Reset user state
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    createParticipant
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;