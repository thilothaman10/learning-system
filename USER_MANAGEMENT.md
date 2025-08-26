# User Management System

## Overview

The LMS now implements a secure user management system where:

- **All new registrations are automatically students**
- **Only admins can create instructors and other admins**
- **Only one admin can exist in the system at a time**
- **User roles are strictly controlled**

## User Roles

### 1. Student (Default)
- **Registration**: Available to all users
- **Access**: Can enroll in courses, take assessments, earn certificates
- **Creation**: Automatic during registration

### 2. Instructor
- **Registration**: Not available during public registration
- **Access**: Can create courses, content, and assessments
- **Creation**: Admin-only through user management panel

### 3. Admin
- **Registration**: Not available during public registration
- **Access**: Full system access including user management
- **Creation**: Admin-only through user management panel
- **Limit**: Only one admin can exist in the system

## System Changes

### Frontend Changes
- ✅ Removed role selection from registration page
- ✅ All users register as students by default
- ✅ Added User Management page for admins
- ✅ Updated routing to include `/admin/users`

### Backend Changes
- ✅ Modified registration route to enforce student-only registration
- ✅ Added admin-only route `/api/auth/create-user` for creating users with specific roles
- ✅ Implemented admin role validation (only one admin allowed)
- ✅ Added role-based access control for user creation

## Setup Instructions

### 1. Create First Admin User

After setting up the database, run:

```bash
npm run create-admin
```

This will create the first admin user:
- **Email**: admin@lms.com
- **Password**: admin123
- **Role**: admin

⚠️ **IMPORTANT**: Change this password immediately after first login!

### 2. Access User Management

1. Login as admin
2. Navigate to Admin Dashboard
3. Click "Manage Users" in Quick Actions
4. Use the user management panel to create instructors and manage users

## API Endpoints

### Public Registration
```
POST /api/auth/register
```
- **Access**: Public
- **Role**: Always creates students
- **Body**: firstName, lastName, email, password

### Admin User Creation
```
POST /api/auth/create-user
```
- **Access**: Admin only
- **Role**: Can create any role (student, instructor, admin)
- **Body**: firstName, lastName, email, password, role
- **Validation**: Only one admin allowed

## Security Features

1. **Role Enforcement**: Registration always creates students
2. **Admin Protection**: Only existing admins can create new admins
3. **Single Admin**: System prevents multiple admin accounts
4. **Access Control**: User management restricted to admins only

## User Management Panel Features

- **View All Users**: List all system users with role and status
- **Create Users**: Add new users with specific roles
- **Edit Users**: Modify user information and roles
- **Toggle Status**: Activate/deactivate users
- **Delete Users**: Remove users (except admins)
- **Search & Filter**: Find users by name, email, or role

## Best Practices

1. **Admin Creation**: Only create admin users when absolutely necessary
2. **Password Security**: Use strong passwords for admin accounts
3. **Role Assignment**: Assign instructor roles only to qualified users
4. **Regular Review**: Periodically review user roles and permissions
5. **Backup**: Keep backups of user data before major changes

## Troubleshooting

### Common Issues

1. **"Access denied" error**: Ensure you're logged in as admin
2. **"Only one admin allowed"**: Check if admin already exists
3. **User not found**: Verify user ID and database connection
4. **Permission denied**: Check user role and authentication status

### Support

For issues with user management:
1. Check server logs for error messages
2. Verify database connection and user authentication
3. Ensure proper role assignments in the database
4. Contact system administrator if problems persist
