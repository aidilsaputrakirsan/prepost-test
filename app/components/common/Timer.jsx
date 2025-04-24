// app/components/common/Timer.jsx - Perbaikan timer yang lebih akurat
import { useState, useEffect, useRef } from 'react';

export default function Timer({ timeLeft, total, serverControlled = true }) {
  // Reference untuk timer lokal
  const localTimerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const [localTimeLeft, setLocalTimeLeft] = useState(timeLeft);
  
  // Sebagai fallback jika server timer lambat, gunakan timer lokal
  useEffect(() => {
    // Reset local timer kapanpun timeLeft berubah dari server
    setLocalTimeLeft(timeLeft);
    startTimeRef.current = Date.now();
    
    // Clear existing timer
    if (localTimerRef.current) {
      clearInterval(localTimerRef.current);
      localTimerRef.current = null;
    }
    
    // Jika server mengendalikan timer, tetap siapkan fallback local timer
    // yang hanya akan digunakan jika server timer terlalu lambat
    if (serverControlled && timeLeft > 0) {
      const timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const calculatedTimeLeft = Math.max(0, timeLeft - elapsedSeconds);
        
        // Only update if it's different (for smoother display)
        if (calculatedTimeLeft !== localTimeLeft) {
          setLocalTimeLeft(calculatedTimeLeft);
        }
        
        // Stop the timer when it hits zero
        if (calculatedTimeLeft <= 0) {
          clearInterval(timerInterval);
        }
      }, 200); // Update lebih sering (5x per detik) agar lebih akurat
      
      localTimerRef.current = timerInterval;
    }
    
    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [timeLeft, serverControlled]);
  
  // Gunakan nilai terendah antara timeLeft dari server dan localTimeLeft
  // untuk menghindari timer yang tampak "melompat" mundur
  const displayTimeLeft = Math.min(timeLeft, localTimeLeft);
  
  // Calculate progress percentage
  const progress = (displayTimeLeft / total) * 100;
  
  // Get color based on time left
  const getTimerColor = () => {
    if (progress > 66) return 'bg-green-500';
    if (progress > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{displayTimeLeft} detik tersisa</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${getTimerColor()} transition-all duration-200`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}