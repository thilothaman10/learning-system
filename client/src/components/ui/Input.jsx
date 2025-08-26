import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = React.forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  as: Component = 'input',
  className = '',
  children,
  ...props
}, ref) => {
  const inputClasses = twMerge(
    clsx(
      'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm',
      'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      'transition-colors duration-200',
      error && 'border-error-300 focus:ring-error-500 focus:border-error-500',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      // Special styling for textarea
      Component === 'textarea' && 'resize-vertical min-h-[80px]',
      // Special styling for select
      Component === 'select' && 'cursor-pointer',
      className
    )
  );
  
  const labelClasses = clsx(
    'block text-sm font-medium text-gray-700 mb-1',
    error && 'text-error-600'
  );
  
  const errorClasses = 'mt-1 text-sm text-error-600';
  const helperClasses = 'mt-1 text-sm text-gray-500';
  
  return (
    <div className="w-full">
      {label && (
        <label className={labelClasses}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}
        
        <Component
          ref={ref}
          className={inputClasses}
          {...props}
        >
          {children}
        </Component>
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className={errorClasses}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className={helperClasses}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
