// app/components/quiz/QuestionHistory.jsx
import React from 'react';

export default function QuestionHistory({ answer }) {
  const { questionText, options, selectedOption, correctOption, isCorrect } = answer;
  
  // Helper to get styles for answer options
  const getOptionStyle = (index) => {
    let styles = "p-3 my-1 border rounded-md flex items-center";
    
    if (index === correctOption) {
      styles += " border-green-500 bg-green-50";
    } else if (index === selectedOption && !isCorrect) {
      styles += " border-red-500 bg-red-50";
    } else {
      styles += " border-gray-200 bg-white text-gray-500";
    }
    
    return styles;
  };
  
  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">{questionText}</h3>
      
      <div className="mb-3">
        {options.map((option, index) => (
          <div key={index} className={getOptionStyle(index)}>
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-medium">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="flex-grow">{option}</span>
            
            {index === selectedOption && (
              <span className={`ml-auto px-2 py-1 text-sm rounded ${
                isCorrect 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {isCorrect ? "Your Answer ✓" : "Your Answer ✗"}
              </span>
            )}
            
            {index === correctOption && index !== selectedOption && (
              <span className="ml-auto px-2 py-1 text-sm rounded bg-green-100 text-green-800">
                Correct Answer
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-500 flex justify-between">
        <span>Response Time: {(answer.responseTime / 1000).toFixed(2)}s</span>
        <span className={isCorrect ? "text-green-600" : "text-red-600"}>
          {isCorrect ? "Correct" : "Incorrect"}
        </span>
      </div>
    </div>
  );
}