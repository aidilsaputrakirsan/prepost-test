'use client';

import { useState, useEffect } from 'react';

export default function QuizCard({ 
  question, 
  options, 
  selectedOption, 
  correctOption, 
  isAnswered,
  onSelect 
}) {
  const [hoveredOption, setHoveredOption] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [lastSelectedOption, setLastSelectedOption] = useState(null);
  const [animatingSelection, setAnimatingSelection] = useState(false);

  // Animasi saat komponen dimuat
  useEffect(() => {
    setAnimateIn(true);
  }, []);

  // Animasi saat memilih opsi
  useEffect(() => {
    if (selectedOption !== null && selectedOption !== lastSelectedOption) {
      setLastSelectedOption(selectedOption);
      setAnimatingSelection(true);
      
      // Reset animasi setelah selesai
      setTimeout(() => {
        setAnimatingSelection(false);
      }, 500);
    }
  }, [selectedOption, lastSelectedOption]);

  // Fungsi untuk mendapatkan kelas dinamis berdasarkan status
  const getOptionClasses = (index) => {
    let baseClasses = "relative p-4 border-2 rounded-xl flex items-center transition-all duration-300 mb-3 overflow-hidden transform";
    
    // Jika pertanyaan sudah dijawab
    if (isAnswered) {
      if (index === correctOption) {
        return `${baseClasses} border-emerald-500 bg-emerald-900/30 text-emerald-300 shadow-md`;
      }
      
      if (selectedOption === index && index !== correctOption) {
        return `${baseClasses} border-red-500 bg-red-900/30 text-red-300 shadow-md`;
      }
      
      return `${baseClasses} border-gray-700 bg-gray-800 text-gray-400`;
    }
    
    // Jika opsi sedang dihover
    if (hoveredOption === index) {
      return `${baseClasses} border-indigo-500 bg-indigo-900/30 shadow-md scale-[1.01] cursor-pointer`;
    }
    
    // Jika opsi dipilih tapi belum disubmit
    if (selectedOption === index) {
      return `${baseClasses} border-indigo-400 bg-indigo-900/30 shadow-md cursor-pointer ${animatingSelection ? 'scale-[1.02]' : ''}`;
    }
    
    // Status default
    return `${baseClasses} border-gray-700 bg-gray-800 hover:bg-gray-750 cursor-pointer`;
  };

  return (
    <div className={`mb-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <p className="text-xl font-medium mb-6 text-gray-200 leading-relaxed">
        {question}
      </p>
      
      <div className="space-y-3">
        {options.map((option, index) => (
          <div
            key={index}
            className={getOptionClasses(index)}
            onClick={() => !isAnswered && onSelect(index)}
            onMouseEnter={() => !isAnswered && setHoveredOption(index)}
            onMouseLeave={() => setHoveredOption(null)}
            style={{ 
              transitionDelay: `${index * 50}ms`,
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Indikator huruf */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 font-medium text-gray-300 transition-colors duration-300">
              {String.fromCharCode(65 + index)}
            </div>
            
            {/* Teks opsi */}
            <span className="flex-grow">{option}</span>
            
            {/* Indikator jawaban benar */}
            {isAnswered && index === correctOption && (
              <span className="ml-auto flex items-center px-3 py-1 bg-emerald-800/40 text-emerald-300 text-sm rounded-full animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Benar
              </span>
            )}
            
            {/* Indikator pilihan Anda (saat salah) */}
            {isAnswered && selectedOption === index && index !== correctOption && (
              <span className="ml-auto flex items-center px-3 py-1 bg-red-800/40 text-red-300 text-sm rounded-full animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Pilihan Anda
              </span>
            )}

            {/* Indikator progress saat dihover */}
            {hoveredOption === index && !isAnswered && (
              <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 rounded-full animate-pulse-subtle" style={{ width: '100%' }}></div>
            )}
            
            {/* Efek ripple saat dipilih */}
            {selectedOption === index && animatingSelection && !isAnswered && (
              <div className="absolute inset-0 bg-indigo-500 opacity-10 animate-ping rounded-xl"></div>
            )}
            
            {/* Indikator dipilih */}
            {selectedOption === index && !isAnswered && (
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-subtle"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}