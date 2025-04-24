// app/layout.js - without 'use client'
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PrePostTEST - Online Quiz Application',
  description: 'A platform for creating and taking online quizzes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex flex-col min-h-screen bg-background text-text`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}