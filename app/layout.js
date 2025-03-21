// app/layout.js - tanpa 'use client'
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
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-100`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}