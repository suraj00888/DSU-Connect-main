const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const resourceRoutes = require('./routes/resources');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const { protect } = require('./middleware/auth');

// Load environment variables
dotenv.config();

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
  console.log('New client connected');

  // Join a group
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);
  });

  // Leave a group
  socket.on('leave_group', (groupId) => {
    socket.leave(groupId);
    console.log(`User left group: ${groupId}`);
  });

  // Handle new message
  socket.on('new_message', (data) => {
    io.to(data.groupId).emit('message_received', data);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.groupId).emit('user_typing', {
      userId: data.userId,
      groupId: data.groupId
    });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    socket.to(data.groupId).emit('user_stop_typing', {
      userId: data.userId,
      groupId: data.groupId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes);
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