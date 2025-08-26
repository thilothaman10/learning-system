import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Card = React.forwardRef(({
  children,
  variant = 'default',
  className = '',
  padding = 'default',
  shadow = 'default',
  ...props
}, ref) => {
  const baseClasses = 'bg-white rounded-xl border transition-all duration-200';
  
  const variants = {
    default: 'border-gray-200',
    primary: 'border-primary-200 bg-primary-50',
    secondary: 'border-secondary-200 bg-secondary-50',
    success: 'border-success-200 bg-success-50',
    warning: 'border-warning-200 bg-warning-50',
    error: 'border-error-200 bg-error-50',
    elevated: 'border-transparent shadow-lg hover:shadow-xl'
  };
  
  const paddingVariants = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const shadowVariants = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const classes = twMerge(
    clsx(
      baseClasses,
      variants[variant],
      paddingVariants[padding],
      shadowVariants[shadow],
      className
    )
  );
  
  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

const CardHeader = ({ children, className = '', ...props }) => (
  <div
    className={twMerge('flex items-center justify-between mb-4', className)}
    {...props}
  >
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3
    className={twMerge('text-lg font-semibold text-gray-900', className)}
    {...props}
  >
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = '', ...props }) => (
  <p
    className={twMerge('text-sm text-gray-600 mt-1', className)}
    {...props}
  >
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div
    className={twMerge('', className)}
    {...props}
  >
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div
    className={twMerge('flex items-center justify-between pt-4 mt-4 border-t border-gray-200', className)}
    {...props}
  >
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
