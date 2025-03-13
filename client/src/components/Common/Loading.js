// client/src/components/Common/Loading.js
import React from 'react';

const Loading = ({ message = 'Memuat...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default Loading;