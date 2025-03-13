// client/src/App.js - Versi lengkap dengan routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuizProvider } from './contexts/QuizContext';

// Import komponen User
import Home from './components/User/Home';
import EnterName from './components/User/EnterName';
import WaitingRoom from './components/User/WaitingRoom';
import QuizQuestion from './components/User/QuizQuestion';
import QuizResults from './components/User/QuizResults';
import Leaderboard from './components/User/Leaderboard';

// Import komponen Admin
import AdminLogin from './components/Admin/AdminLogin';
import AdminRegister from './components/Admin/AdminRegister';
import AdminPanel from './components/Admin/AdminPanel';
import CreateQuestion from './components/Admin/CreateQuestion';
import ParticipantsList from './components/Admin/ParticipantsList';
import QuizControl from './components/Admin/QuizControl';

// Import komponen Common
import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import NotFound from './components/Common/NotFound';

// Import CSS
import './styles.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <QuizProvider>
          <div className="app-container">
            <Header />
            <main className="main-content">
              <Routes>
                {/* User Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/join/:quizId" element={<EnterName />} />
                <Route path="/waiting-room/:quizId" element={<WaitingRoom />} />
                <Route path="/quiz/:quizId" element={<QuizQuestion />} />
                <Route path="/results/:quizId" element={<QuizResults />} />
                <Route path="/leaderboard/:quizId" element={<Leaderboard />} />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                <Route path="/admin/panel" element={<AdminPanel />} />
                <Route path="/admin/create-question/:quizId" element={<CreateQuestion />} />
                <Route path="/admin/participants/:quizId" element={<ParticipantsList />} />
                <Route path="/admin/control/:quizId" element={<QuizControl />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </QuizProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;