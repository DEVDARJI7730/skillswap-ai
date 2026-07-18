import React from 'react';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const getInitials = (name: string) => {
    if (!name) return 'SS';
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getBgColor = (text: string) => {
    const colors = [
      'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20',
      'bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-500/20',
      'bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 border-cyan-500/20',
      'bg-pink-500/10 text-pink-650 dark:text-pink-400 border-pink-500/20',
      'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20',
      'bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20',
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const isMock = !src || src.includes('dicebear.com');

  return (
    <div className={`relative rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0 flex items-center justify-center font-bold tracking-wider ${sizes[size]} ${className}`}>
      {isMock ? (
        <div className={`w-full h-full flex items-center justify-center border rounded-full ${getBgColor(alt)}`}>
          {getInitials(alt)}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      )}
    </div>
  );
};

export default Avatar;
