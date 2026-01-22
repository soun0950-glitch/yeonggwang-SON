
import React from 'react';

interface BallProps {
  number: number | string;
  isSpecial?: boolean;
  animate?: boolean;
  delay?: number;
}

const Ball: React.FC<BallProps> = ({ number, isSpecial = false, animate = true, delay = 0 }) => {
  const baseClasses = "w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full text-2xl md:text-3xl font-bold shadow-xl border-2 transition-all duration-500 transform hover:scale-110";
  const colorClasses = isSpecial 
    ? "bg-gradient-to-br from-red-500 to-rose-700 text-white border-rose-400 shadow-rose-900/40" 
    : "bg-gradient-to-br from-indigo-500 to-purple-700 text-white border-indigo-400 shadow-indigo-900/40";

  return (
    <div 
      className={`${baseClasses} ${colorClasses} ${animate ? 'animate-float' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="drop-shadow-md">{number}</span>
    </div>
  );
};

export default Ball;
