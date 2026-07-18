import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, glow = false, className = '', ...props }) => {
  return (
    <div
      className={`glass-card p-6 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-all duration-300 ${glow ? 'glass-card-glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
