// app/components/quiz/QuestionHistory.jsx
import React from 'react';

export default function QuestionHistory({ answer }) {
  const { questionText, options, selectedOption, correctOption, isCorrect } = answer;
  
  // Helper untuk mendapatkan style untuk opsi jawaban
  const getOptionStyle = (index) => {
    let styles = "p-3 my-1 border rounded-md flex items-center";
    
    if (index === correctOption) {
      styles += " border-green-500 bg-green-900/20 text-green-300";
    } else if (index === selectedOption && !isCorrect) {
      styles += " border-red-500 bg-red-900/20 text-red-300";
    } else {
      styles += " border-gray-700 bg-gray-800 text-gray-400";
    }
    
    return styles;
  };
  
  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-200">{questionText}</h3>
      
      <div className="mb-3">
        {options.map((option, index) => (
          <div key={index} className={getOptionStyle(index)}>
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 font-medium text-gray-300">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="flex-grow">{option}</span>
            
            {index === selectedOption && (
              <span className={`ml-auto px-2 py-1 text-sm rounded ${
                isCorrect 
                  ? "bg-green-900/40 text-green-300" 
                  : "bg-red-900/40 text-red-300"
              }`}>
                {isCorrect ? "Jawaban Anda ✓" : "Jawaban Anda ✗"}
              </span>
            )}
            
            {index === correctOption && index !== selectedOption && (
              <span className="ml-auto px-2 py-1 text-sm rounded bg-green-900/40 text-green-300">
                Jawaban Benar
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-500 flex justify-between">
        <span>Waktu Respons: {(answer.responseTime / 1000).toFixed(2)}s</span>
        <span className={isCorrect ? "text-green-400" : "text-red-400"}>
          {isCorrect ? "Benar" : "Salah"}
        </span>
      </div>
    </div>
  );
}