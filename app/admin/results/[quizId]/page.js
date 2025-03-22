'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Loading from '@/app/components/common/Loading';

export default function AdminResultsRedirect() {
  const params = useParams();
  const quizId = params.quizId;
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/login');
      return;
    }
    
    // Redirect to leaderboard page
    router.push(`/admin/leaderboard/${quizId}`);
  }, [user, router, quizId]);
  
  return <Loading message="Redirecting to leaderboard..." />;
}