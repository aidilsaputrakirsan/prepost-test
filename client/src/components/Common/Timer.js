// client/src/components/Common/Timer.js
import React, { useEffect, useState } from 'react';

const Timer = ({ timeLeft, total }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setProgress((timeLeft / total) * 100);
  }, [timeLeft, total]);

  // Get color based on time left
  const getTimerColor = () => {
    if (progress > 66) return 'timer-green';
    if (progress > 33) return 'timer-yellow';
    return 'timer-red';
  };

  return (
    <div className="timer-container">
      <div className="timer-text">{timeLeft} detik</div>
      <div className="timer-bar">
        <div
          className={`timer-progress ${getTimerColor()}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Timer;