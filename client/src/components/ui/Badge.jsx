import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Badge = React.forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    info: 'bg-blue-100 text-blue-800',
    white: 'bg-white text-gray-800 border border-gray-300'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm',
    xl: 'px-4 py-1.5 text-base'
  };
  
  const classes = twMerge(
    clsx(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    )
  );
  
  return (
    <span
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
