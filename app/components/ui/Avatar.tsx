import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/app/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  if (name) {
    return (
      <div
        className={cn(
          'rounded-full bg-amber-100 text-amber-700 font-medium flex items-center justify-center',
          sizeClasses[size],
          className
        )}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-slate-100 text-slate-400 flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <User className={iconSizes[size]} />
    </div>
  );
}
