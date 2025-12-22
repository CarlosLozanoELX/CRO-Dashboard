import React from 'react';

export const Card = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`
        glass-panel rounded-2xl p-6 transition-all duration-300
        ${hover ? 'hover:bg-white/5 hover:scale-[1.01] hover:shadow-glow-blue/20 hover:border-neon-blue/30' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
