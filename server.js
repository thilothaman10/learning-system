const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
//app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded content
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/content', require('./routes/content'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle client-side routing for both development and production
if (process.env.NODE_ENV === 'production') {
  // Production: Serve static files from the React build folder
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // Development: Handle client-side routes by serving a simple HTML page
  app.get('*', (req, res) => {
    // Check if it's an API route
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    
    // For all other routes, serve a simple HTML page that redirects to React dev server
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <script>
            // Redirect to React dev server with the same path
            window.location.href = 'http://localhost:3000${req.path}';
          </script>
        </head>
        <body>
          <p>Redirecting to React app...</p>
          <p>If you're not redirected automatically, <a href="http://localhost:3000${req.path}">click here</a></p>
        </body>
      </html>
    `;
    res.send(html);
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
