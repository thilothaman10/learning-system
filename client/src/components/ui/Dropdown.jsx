import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check } from 'lucide-react';

const Dropdown = React.forwardRef(({
  trigger,
  children,
  className = '',
  placement = 'bottom',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const placementClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  const dropdownClasses = twMerge(
    clsx(
      'absolute z-50 min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1',
      'animate-in fade-in-0 zoom-in-95 duration-200',
      placementClasses[placement],
      className
    )
  );

  return (
    <div className="relative" ref={ref} {...props}>
      <div ref={triggerRef} onClick={toggleDropdown}>
        {trigger}
      </div>
      
      {isOpen && (
        <div ref={dropdownRef} className={dropdownClasses}>
          {children}
        </div>
      )}
    </div>
  );
});

const DropdownItem = React.forwardRef(({
  children,
  onClick,
  icon,
  rightIcon,
  selected = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const itemClasses = twMerge(
    clsx(
      'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors duration-150',
      selected && 'bg-primary-50 text-primary-700',
      disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
      className
    )
  );

  return (
    <div
      ref={ref}
      className={itemClasses}
      onClick={!disabled ? onClick : undefined}
      {...props}
    >
      {icon && (
        <span className="mr-3 text-gray-400">
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
      {selected && (
        <Check className="h-4 w-4 text-primary-600 ml-2" />
      )}
      {rightIcon && (
        <span className="ml-2 text-gray-400">
          {rightIcon}
        </span>
      )}
    </div>
  );
});

const DropdownDivider = ({ className = '', ...props }) => (
  <div
    className={twMerge('border-t border-gray-200 my-1', className)}
    {...props}
  />
);

const DropdownHeader = ({ children, className = '', ...props }) => (
  <div
    className={twMerge('px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide', className)}
    {...props}
  >
    {children}
  </div>
);

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;
Dropdown.Header = DropdownHeader;

export default Dropdown;
