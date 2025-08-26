import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Camera,
  Shield,
  Bell,
  Palette,
  Globe,
  BookOpen,
  Award,
  Clock,
  Star
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || ''
    });
    setIsEditing(false);
  };

  const stats = [
    { label: 'Courses Enrolled', value: '12', icon: BookOpen, color: 'primary' },
    { label: 'Courses Completed', value: '5', icon: Award, color: 'success' },
    { label: 'Hours Learned', value: '48h', icon: Clock, color: 'warning' },
    { label: 'Average Rating', value: '4.8', icon: Star, color: 'info' }
  ];

  const recentAchievements = [
    { title: 'First Course Completed', description: 'Completed your first course', icon: '🎉', date: '2024-01-10' },
    { title: '7-Day Streak', description: 'Maintained a 7-day learning streak', icon: '🔥', date: '2024-01-12' },
    { title: 'Perfect Score', description: 'Achieved 100% on an assessment', icon: '⭐', date: '2024-01-08' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
            </div>
            {!isEditing && (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <Card.Header>
                <Card.Title>Personal Information</Card.Title>
                {isEditing && (
                  <div className="flex space-x-2">
                    <Button variant="success" size="sm" onClick={handleSave} loading={isLoading}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    leftIcon={<User className="w-5 h-5" />}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    leftIcon={<User className="w-5 h-5" />}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    leftIcon={<Mail className="w-5 h-5" />}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    leftIcon={<Phone className="w-5 h-5" />}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    leftIcon={<MapPin className="w-5 h-5" />}
                    disabled={!isEditing}
                    className="md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Bio"
                      as="textarea"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Statistics */}
            <Card>
              <Card.Header>
                <Card.Title>Learning Statistics</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`w-16 h-16 bg-${stat.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
                      <div className="text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <Card.Header>
                <Card.Title>Recent Achievements</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {recentAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900">{achievement.title}</h4>
                        <p className="text-sm text-yellow-700">{achievement.description}</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <Card>
              <Card.Content className="text-center p-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold text-primary-700">
                      {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                    </span>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors duration-200">
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-gray-600 mb-4">{user?.email}</p>
                <Badge variant="primary">{user?.role || 'Student'}</Badge>
              </Card.Content>
            </Card>

            {/* Quick Actions */}
            <Card>
              <Card.Header>
                <Card.Title>Quick Actions</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    My Courses
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="w-4 h-4 mr-2" />
                    Certificates
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    Learning History
                  </Button>
                </div>
              </Card.Content>
            </Card>

            {/* Settings */}
            <Card>
              <Card.Header>
                <Card.Title>Settings</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy & Security
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Palette className="w-4 h-4 mr-2" />
                    Appearance
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Globe className="w-4 h-4 mr-2" />
                    Language
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
