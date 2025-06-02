const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const userProfileRoutes = require('./routes/user');
const eventRoutes = require('./routes/events');
const resourceRoutes = require('./routes/resources');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const { protect } = require('./middleware/auth');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make socket instance globally available
global.io = io;

// Middleware
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a group
  socket.on('join_group', (data) => {
    const groupId = typeof data === 'string' ? data : data.groupId;
    if (groupId) {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    }
  });

  // Leave a group
  socket.on('leave_group', (data) => {
    const groupId = typeof data === 'string' ? data : data.groupId;
    if (groupId) {
      socket.leave(groupId);
      console.log(`Socket ${socket.id} left group ${groupId}`);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    if (data.groupId) {
      socket.to(data.groupId).emit('typing', {
        userId: data.userId,
        isTyping: data.isTyping
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/events', protect, eventRoutes);
app.use('/api/resources', protect, resourceRoutes);
app.use('/api/groups', protect, groupRoutes);
app.use('/api/messages', protect, messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 