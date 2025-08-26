import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Users, 
  Shield, 
  GraduationCap,
  UserPlus,
  Filter
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import toast from 'react-hot-toast';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const { 
    getAllUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    loading, 
    error 
  } = useUsers();
  
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [createUserData, setCreateUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student'
  });

  const roleOptions = [
    { value: 'student', label: 'Student', icon: GraduationCap, color: 'primary' },
    { value: 'instructor', label: 'Instructor', icon: Users, color: 'success' },
    { value: 'admin', label: 'Admin', icon: Shield, color: 'error' }
  ];

  const getRoleIcon = (role) => {
    const roleOption = roleOptions.find(r => r.value === role);
    if (roleOption) {
      const Icon = roleOption.icon;
      return <Icon className={`h-4 w-4 text-${roleOption.color}-600`} />;
    }
    return <Users className="h-4 w-4 text-gray-600" />;
  };

  const getRoleColor = (role) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.color : 'secondary';
  };

  const getRoleLabel = (role) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption ? roleOption.label : role;
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        if (response && response.users) {
          setUsers(response.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        // For now, use mock data if API fails
        const mockUsers = [
          {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            role: 'student',
            isActive: true,
            createdAt: new Date('2024-01-15')
          },
          {
            _id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            role: 'instructor',
            isActive: true,
            createdAt: new Date('2024-01-10')
          },
          {
            _id: '3',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            role: 'admin',
            isActive: true,
            createdAt: new Date('2024-01-01')
          }
        ];
        setUsers(mockUsers);
      }
    };

    fetchUsers();
  }, [getAllUsers]);

  const handleCreateUser = async () => {
    try {
      // Validate form
      if (!createUserData.firstName || !createUserData.lastName || !createUserData.email || !createUserData.password) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (createUserData.password !== createUserData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const userData = {
        firstName: createUserData.firstName,
        lastName: createUserData.lastName,
        email: createUserData.email,
        password: createUserData.password,
        role: createUserData.role
      };

      const response = await createUser(userData);
      if (response && response.user) {
        setUsers(prev => [...prev, response.user]);
        setShowCreateModal(false);
        setCreateUserData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'student'
        });
        toast.success('User created successfully');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      // Error is already handled by the useUsers hook
    }
  };

  const handleEditUser = async () => {
    try {
      const userData = {
        firstName: editUserData.firstName,
        lastName: editUserData.lastName,
        email: editUserData.email,
        role: editUserData.role
      };

      const response = await updateUser(selectedUser._id, userData);
      if (response && response.user) {
        setUsers(prev => prev.map(u => 
          u._id === selectedUser._id 
            ? { ...u, ...response.user }
            : u
        ));
        setShowEditModal(false);
        setSelectedUser(null);
        toast.success('User updated successfully');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      // Error is already handled by the useUsers hook
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId);
        setUsers(prev => prev.filter(u => u._id !== userId));
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        // Error is already handled by the useUsers hook
      }
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
      if (user) {
        const userData = { isActive: !user.isActive };
        const response = await updateUser(userId, userData);
        if (response && response.user) {
          setUsers(prev => prev.map(u => 
            u._id === userId 
              ? { ...u, isActive: !u.isActive }
              : u
          ));
          toast.success('User status updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      // Error is already handled by the useUsers hook
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage platform users and roles</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              disabled={currentUser?.role !== 'admin'}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <Card.Content>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Roles</option>
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card>
            <Card.Content className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterRole !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first user'
                }
              </p>
              {!searchTerm && filterRole === 'all' && currentUser?.role === 'admin' && (
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredUsers.map((user) => (
              <Card key={user._id}>
                <Card.Content>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </h3>
                          <Badge variant={user.isActive ? 'success' : 'warning'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{user.email}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditUserData({
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            role: user.role
                          });
                          setShowEditModal(true);
                        }}
                        disabled={currentUser?.role !== 'admin'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user._id)}
                        disabled={currentUser?.role !== 'admin'}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-error-600 hover:text-error-700"
                        disabled={currentUser?.role !== 'admin' || user.role === 'admin'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={createUserData.firstName}
              onChange={(e) => setCreateUserData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name *"
              value={createUserData.lastName}
              onChange={(e) => setCreateUserData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter last name"
            />
          </div>
          
          <Input
            label="Email *"
            type="email"
            value={createUserData.email}
            onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password *"
              type="password"
              value={createUserData.password}
              onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
            />
            <Input
              label="Confirm Password *"
              type="password"
              value={createUserData.confirmPassword}
              onChange={(e) => setCreateUserData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={createUserData.role}
              onChange={(e) => setCreateUserData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateUser}
              loading={loading}
            >
              Create User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={editUserData.firstName}
              onChange={(e) => setEditUserData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name *"
              value={editUserData.lastName}
              onChange={(e) => setEditUserData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter last name"
            />
          </div>
          
          <Input
            label="Email *"
            type="email"
            value={editUserData.email}
            onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={editUserData.role}
              onChange={(e) => setEditUserData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditUser}
              loading={loading}
            >
              Update User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
