# Learning Management System (LMS)

A comprehensive Learning Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) that provides a complete solution for online learning, course management, and skill development.

## Features

### 🎓 Course Management
- Create and manage courses with rich content
- Support for multiple content types (video, audio, documents, text)
- Course categorization and difficulty levels
- Course publishing and enrollment management
- Student progress tracking

### 📚 Content Delivery
- **Video Content**: MP4, AVI, MOV, WMV, FLV, WebM support
- **Audio Content**: MP3, WAV, AAC, OGG, WMA support
- **Document Content**: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT support
- **Text Content**: Rich text and markdown support
- **Interactive Content**: Quizzes and assignments

### 📝 Assessment System
- Multiple question types:
  - Multiple choice questions
  - True/False questions
  - Fill-in-the-blank questions
  - Essay questions
  - Matching questions
  - Ordering questions
- Automated grading for objective questions
- Manual grading for subjective questions
- Time limits and attempt restrictions
- Detailed performance analytics

### 🏆 Certificate System
- Automated certificate generation upon course completion
- Customizable certificate templates
- Digital verification with unique hashes
- QR code generation for easy verification
- Download and sharing capabilities

### 👥 User Management
- Role-based access control (Student, Instructor, Admin)
- User profiles and progress tracking
- Enrollment management
- Course completion tracking

### 📊 Analytics & Reporting
- Student progress tracking
- Course completion rates
- Assessment performance analytics
- Time spent on content
- Learning analytics dashboard

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd esg-software
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# MONGODB_URI=mongodb://localhost:27017/lms
# JWT_SECRET=your_jwt_secret_key_here
# PORT=5000

# Start MongoDB service
# On Windows: Start MongoDB service
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# Run the application
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at:
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course (Instructor/Admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/:id/progress` - Get course progress

### Content
- `GET /api/content` - Get course content
- `POST /api/content` - Create new content
- `POST /api/content/upload` - Upload content files
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

### Assessments
- `GET /api/assessments` - Get course assessments
- `POST /api/assessments` - Create new assessment
- `POST /api/assessments/:id/submit` - Submit assessment answers
- `POST /api/assessments/:id/questions` - Add questions to assessment

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Create new enrollment
- `PUT /api/enrollments/:id` - Update enrollment status
- `GET /api/enrollments/:id/progress` - Get enrollment progress

### Certificates
- `GET /api/certificates` - Get user certificates
- `POST /api/certificates/generate` - Generate certificate
- `GET /api/certificates/:id/download` - Download certificate
- `GET /api/certificates/verify/:number` - Verify certificate

## Project Structure

```
esg-software/
├── models/                 # Database models
│   ├── User.js
│   ├── Course.js
│   ├── Content.js
│   ├── Assessment.js
│   ├── Question.js
│   ├── Enrollment.js
│   └── Certificate.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── users.js
│   ├── courses.js
│   ├── content.js
│   ├── assessments.js
│   ├── enrollments.js
│   └── certificates.js
├── middleware/             # Custom middleware
│   └── auth.js
├── uploads/                # File uploads
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
├── server.js               # Main server file
├── package.json
└── README.md
```

## Usage

### For Students
1. Register/Login to your account
2. Browse available courses
3. Enroll in courses of interest
4. Access course content and complete assessments
5. Track your progress and download certificates

### For Instructors
1. Register/Login with instructor role
2. Create and manage courses
3. Upload course content (videos, documents, etc.)
4. Create assessments and questions
5. Monitor student progress and performance
6. Generate certificates for completed students

### For Administrators
1. Manage all users and their roles
2. Oversee course creation and management
3. Monitor system usage and analytics
4. Manage certificates and verifications
5. System configuration and maintenance

## File Upload Support

The system supports various file formats:

- **Video**: MP4, AVI, MOV, WMV, FLV, WebM
- **Audio**: MP3, WAV, AAC, OGG, WMA
- **Documents**: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT
- **Images**: JPG, PNG, GIF, SVG
- **Maximum file size**: 100MB

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- File upload security
- CORS protection
- Helmet security headers

## Performance Features

- Database indexing for fast queries
- File streaming for large content
- Pagination for large datasets
- React Query for efficient data fetching
- Optimized image and video delivery

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with external LMS platforms
- [ ] Multi-language support
- [ ] Advanced assessment types
- [ ] Social learning features
- [ ] Gamification elements
- [ ] AI-powered content recommendations

## Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- MongoDB team for the database
- Express.js community for the web framework
- All contributors and supporters
