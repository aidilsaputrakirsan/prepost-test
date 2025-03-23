// app/components/quiz/QuizCard.jsx
'use client';

import { useState } from 'react';

export default function QuizCard({ 
  question, 
  options, 
  selectedOption, 
  correctOption, 
  isAnswered,
  onSelect 
}) {
  const [hoveredOption, setHoveredOption] = useState(null);

  // Function to get dynamic class names based on state
  const getOptionClasses = (index) => {
    let baseClasses = "p-4 border-2 rounded-lg flex items-center transition-all duration-300 mb-3 relative overflow-hidden";
    
    // If question has been answered
    if (isAnswered) {
      if (index === correctOption) {
        return `${baseClasses} border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 shadow-md`;
      }
      
      if (selectedOption === index && index !== correctOption) {
        return `${baseClasses} border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 shadow-md`;
      }
      
      return `${baseClasses} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400`;
    }
    
    // If option is being hovered
    if (hoveredOption === index) {
      return `${baseClasses} border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md transform scale-[1.01] cursor-pointer`;
    }
    
    // If option is selected but not submitted
    if (selectedOption === index) {
      return `${baseClasses} border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md cursor-pointer`;
    }
    
    // Default state
    return `${baseClasses} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer`;
  };

  return (
    <div className="mb-6 animate-scale-in">
      <p className="text-lg font-medium mb-6 text-gray-800 dark:text-gray-200">{question}</p>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={index}
            className={getOptionClasses(index)}
            onClick={() => !isAnswered && onSelect(index)}
            onMouseEnter={() => !isAnswered && setHoveredOption(index)}
            onMouseLeave={() => setHoveredOption(null)}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 font-medium text-gray-700 dark:text-gray-300">
              {String.fromCharCode(65 + index)}
            </div>
            <span className="flex-grow">{option}</span>
            
            {isAnswered && index === correctOption && (
              <span className="ml-auto flex items-center px-2 py-1 bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300 text-sm rounded-full animate-fade-in-down">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Correct
              </span>
            )}
            
            {isAnswered && selectedOption === index && index !== correctOption && (
              <span className="ml-auto flex items-center px-2 py-1 bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300 text-sm rounded-full animate-fade-in-down">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Your Choice
              </span>
            )}

            {/* Progress indicator for options that appears when hovered */}
            {hoveredOption === index && !isAnswered && (
              <div className="absolute bottom-0 left-0 h-1 bg-blue-500 dark:bg-blue-400 animate-pulse-subtle" style={{ width: '100%' }}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}