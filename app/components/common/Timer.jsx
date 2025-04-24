'use client';

import { useState, useEffect, useRef } from 'react';

export default function Timer({ timeLeft, total, serverControlled = true }) {
  // Referensi untuk timer lokal
  const localTimerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [localTimeLeft, setLocalTimeLeft] = useState(timeLeft);
  const [isWarning, setIsWarning] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  
  // Hitung apakah timer harus menampilkan warning/urgent
  useEffect(() => {
    const progress = timeLeft / total;
    setIsWarning(progress <= 0.5 && progress > 0.25);
    setIsUrgent(progress <= 0.25);
    
    // Tambahkan efek pulse di 5 detik terakhir
    setPulseEffect(timeLeft <= 5 && timeLeft > 0);
  }, [timeLeft, total]);
  
  // Gunakan timer lokal sebagai fallback jika server lambat
  useEffect(() => {
    setLocalTimeLeft(timeLeft);
    startTimeRef.current = Date.now();
    
    if (localTimerRef.current) {
      clearInterval(localTimerRef.current);
      localTimerRef.current = null;
    }
    
    if (serverControlled && timeLeft > 0) {
      const timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const calculatedTimeLeft = Math.max(0, timeLeft - elapsedSeconds);
        
        if (calculatedTimeLeft !== localTimeLeft) {
          setLocalTimeLeft(calculatedTimeLeft);
        }
        
        if (calculatedTimeLeft <= 0) {
          clearInterval(timerInterval);
        }
      }, 200);
      
      localTimerRef.current = timerInterval;
    }
    
    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [timeLeft, serverControlled]);
  
  // Gunakan nilai terendah antara server dan lokal untuk hindari lompatan mundur
  const displayTimeLeft = Math.min(timeLeft, localTimeLeft);
  
  // Hitung persentase progress
  const progress = (displayTimeLeft / total) * 100;
  
  // Dapatkan warna timer berdasarkan waktu tersisa
  const getTimerColor = () => {
    if (isUrgent) return 'bg-red-600';
    if (isWarning) return 'bg-amber-600';
    return 'bg-emerald-600';
  };
  
  // Format detik untuk tampilkan sebagai MM:SS jika total > 60
  const formatTime = (seconds) => {
    if (total <= 60) return `${seconds}s`;
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" 
               className={`h-5 w-5 mr-2 ${
                 isUrgent ? 'text-red-400' : 
                 isWarning ? 'text-amber-400' : 
                 'text-emerald-400'
               } ${pulseEffect ? 'animate-pulse' : ''}`}
               viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className={`font-medium ${
            isUrgent ? 'text-red-400' : 
            isWarning ? 'text-amber-400' : 
            'text-gray-300'
          } ${pulseEffect ? 'animate-pulse' : ''}`}>
            {formatTime(displayTimeLeft)} tersisa
          </span>
        </div>
        
        <span className="text-sm text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getTimerColor()} rounded-full transition-all duration-300 ease-out`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Indikator visual untuk urgensi */}
      {isUrgent && (
        <div className="flex justify-end mt-1">
          <p className="text-xs text-red-400 font-medium">
            {displayTimeLeft <= 5 ? "Jawab cepat!" : "Waktu hampir habis!"}
          </p>
        </div>
      )}
    </div>
  );
}