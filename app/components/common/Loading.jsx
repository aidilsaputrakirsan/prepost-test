'use client';

import { useState, useEffect } from 'react';

export default function Loading({ message = 'Memuat...', type = 'spinner' }) {
  const [loadingMessage, setLoadingMessage] = useState(message);
  const [dots, setDots] = useState('');
  
  // Animasi titik-titik untuk pesan pemuatan
  useEffect(() => {
    if (!message.endsWith('...')) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 400);
      
      return () => clearInterval(interval);
    }
  }, [message]);
  
  // Perbarui pesan pemuatan dengan titik-titik animasi
  useEffect(() => {
    if (!message.endsWith('...')) {
      setLoadingMessage(`${message}${dots}`);
    } else {
      setLoadingMessage(message);
    }
  }, [dots, message]);
  
  // Pesan penyemangat acak yang berganti setiap 4 detik
  const [encouragingMessage, setEncouragingMessage] = useState('');
  
  useEffect(() => {
    const messages = [
      "Sebentar lagi selesai!",
      "Hanya sebentar lagi...",
      "Mempersiapkan segalanya untuk Anda",
      "Menyiapkan pengalaman Anda",
      "Ini tidak akan lama",
      "Mohon tunggu sebentar",
    ];
    
    // Tetapkan pesan awal
    setEncouragingMessage(messages[Math.floor(Math.random() * messages.length)]);
    
    // Siklus melalui pesan
    const interval = setInterval(() => {
      setEncouragingMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Render animasi pemuatan berbeda berdasarkan tipe
  const renderLoadingAnimation = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-2 justify-center items-center">
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                className="h-4 w-4 bg-indigo-400 rounded-full"
                style={{ 
                  animationName: 'bounce',
                  animationDuration: '0.6s',
                  animationDelay: `${dot * 0.15}s`,
                  animationIterationCount: 'infinite',
                  animationDirection: 'alternate',
                }}
              />
            ))}
          </div>
        );
        
      case 'progress':
        return (
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 rounded-full animate-shimmer" 
                 style={{ width: '60%' }}></div>
          </div>
        );
        
      case 'brain':
        return (
          <div className="relative">
            <div className="text-4xl animate-pulse-subtle animate-float">🧠</div>
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-indigo-400 rounded-full animate-ping"></div>
          </div>
        );
        
      case 'spinner':
      default:
        return (
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700 opacity-25"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin"></div>
            
            {/* Lingkaran dalam */}
            <div className="absolute inset-[0.35rem] rounded-full border-2 border-gray-700 opacity-50"></div>
            <div className="absolute inset-[0.35rem] rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" 
                 style={{ animationDuration: '0.75s', animationDirection: 'reverse' }}></div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12 animate-fade-in bg-gray-800">
      {renderLoadingAnimation()}
      <p className="mt-6 text-gray-200 font-medium text-xl">
        {loadingMessage}
      </p>
      <p className="mt-2 text-gray-400 text-sm animate-fade-in">
        {encouragingMessage}
      </p>
    </div>
  );
}