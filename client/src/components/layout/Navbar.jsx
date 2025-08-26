import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, User, BookOpen, GraduationCap, Settings, LogOut, Search } from 'lucide-react';
import Button from '../ui/Button';
import Dropdown from '../ui/Dropdown';
import Input from '../ui/Input';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/', icon: BookOpen },
    { name: 'Courses', href: '/courses', icon: GraduationCap },
  ];

  const userMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: User },
    { name: 'Profile', href: '/profile', icon: User },
    ...(user?.role === 'admin' ? [{ name: 'Admin Dashboard', href: '/admin/dashboard', icon: Settings }] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Logout', onClick: handleLogout, icon: LogOut },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Search Bar */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LearnHub</span>
            </Link>

            {/* Search Bar */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  className="pl-10 w-80 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <Dropdown
                trigger={
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {user.firstName?.[0] || user.email?.[0] || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user.firstName || 'User'}</span>
                  </button>
                }
              >
                {userMenuItems.map((item) => (
                  <Dropdown.Item
                    key={item.name}
                    icon={<item.icon className="w-4 h-4" />}
                    onClick={item.onClick}
                    {...(item.href ? { as: Link, to: item.href } : {})}
                  >
                    {item.name}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Button variant="outline" size="sm" as={Link} to="/login">
                  Sign In
                </Button>
                <Button variant="primary" size="sm" as={Link} to="/register">
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          {/* Mobile Search Bar */}
          <div className="px-3 py-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search courses..."
                className="pl-10 w-full border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-600 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            {!user && (
              <div className="pt-4 space-y-2">
                <Button variant="outline" size="sm" as={Link} to="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" as={Link} to="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
