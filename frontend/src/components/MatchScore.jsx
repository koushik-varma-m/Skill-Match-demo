import React from 'react';

const MatchScore = ({ score }) => {
  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-teal-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 0.8) return 'Excellent Match!';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Moderate Match';
    return 'Poor Match';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={getScoreColor(score).replace('text-', '')}
            strokeWidth="3"
            strokeDasharray={`${score * 100}, 100`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {Math.round(score * 100)}%
          </span>
        </div>
      </div>
      <div>
        <p className={`font-medium ${getScoreColor(score)}`}>
          {getScoreMessage(score)}
        </p>
        <p className="text-sm text-gray-500">
          Based on your profile
        </p>
      </div>
    </div>
  );
};

export default MatchScore; 