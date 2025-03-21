// app/components/common/Timer.jsx
export default function Timer({ timeLeft, total }) {
    // Calculate progress percentage
    const progress = (timeLeft / total) * 100;
  
    // Get color based on time left
    const getTimerColor = () => {
      if (progress > 66) return 'bg-green-500';
      if (progress > 33) return 'bg-yellow-500';
      return 'bg-red-500';
    };
  
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{timeLeft} seconds remaining</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getTimerColor()}`} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  }