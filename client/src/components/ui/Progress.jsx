import React from 'react';
import { cn } from '../../utils/cn';

const Progress = ({ 
  value, 
  max = 100, 
  size = 'md', 
  variant = 'default',
  className,
  ...props 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6'
  };
  
  const variantClasses = {
    default: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };

  return (
    <div 
      className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full transition-all duration-300 ease-in-out',
          variantClasses[variant]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default Progress;
