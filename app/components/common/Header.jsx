// app/components/common/Header.jsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0">
          <Link href="/" className="text-2xl font-bold hover:text-blue-100 transition duration-200">
            PrePostTEST
          </Link>
        </div>
        
        {user && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span>Hello, {user.name}</span>
            {user.isAdmin && (
              <Link 
                href="/admin/panel" 
                className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-800 transition duration-200"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={logout}
              className="px-3 py-1 bg-blue-700 rounded hover:bg-blue-800 transition duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}