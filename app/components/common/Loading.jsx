// app/components/common/Loading.jsx
'use client';

export default function Loading({ message = 'Loading...', type = 'spinner' }) {
  // Render different loading animations based on type
  const renderLoadingAnimation = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-2 justify-center items-center">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className="h-3 w-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${dot * 0.15}s` }}
              />
            ))}
          </div>
        );
        
      case 'progress':
        return (
          <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="shimmer w-full h-full">
              <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        );
        
      case 'spinner':
      default:
        return (
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400 animate-spin" />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in-down">
      {renderLoadingAnimation()}
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">{message}</p>
    </div>
  );
}