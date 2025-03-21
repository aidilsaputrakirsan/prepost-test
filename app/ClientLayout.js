'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

export default function ClientLayout({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <QuizProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </QuizProvider>
      </AuthProvider>
    </SessionProvider>
  );
}