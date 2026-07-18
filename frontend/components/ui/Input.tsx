import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-4 py-2 text-sm border rounded-lg focus:outline-none transition-all duration-200 glass-input ${error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
