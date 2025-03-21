import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PrePostTEST - Online Quiz Application',
  description: 'A platform for creating and taking online quizzes',
};

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-100`}>
        <SessionProvider session={session}>
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
      </body>
    </html>
  );
}