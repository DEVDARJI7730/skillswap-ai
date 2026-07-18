import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border';
  
  const variants = {
    primary: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
    secondary: 'bg-slate-700/30 text-slate-300 border-slate-700/50',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    info: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;
