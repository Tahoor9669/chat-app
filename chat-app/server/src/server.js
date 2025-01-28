require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const connectDB = require('./config/db.config');
const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');
const channelRoutes = require('./routes/channel.routes');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const { auth } = require('./middleware/auth.middleware');
const channelController = require('./controllers/channel.controller');
const path = require('path');
const userRoutes = require('./routes/user.routes');

const app = express();
const httpServer = createServer(app);

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true
};

// Setup PeerJS Server
const peerServer = ExpressPeerServer(httpServer, {
  debug: true,
  path: '/peerjs',
  proxied: true,
  allow_discovery: true,
  timeout: 60000,
  corsOptions: corsOptions
});

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Setup Socket.IO with CORS
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['polling']
});

// PeerJS server setup and routes
app.use('/peerjs', peerServer);

// Add PeerJS health check endpoint
app.get('/peerjs/status', (req, res) => {
  res.json({
    status: 'ok',
    clients: peerServer._clients.size
  });
});

// PeerJS event handlers
peerServer.on('connection', (client) => {
  console.log('New client connected to PeerJS server:', client.getId());
  console.log('Total connected clients:', peerServer._clients.size);
});

peerServer.on('disconnect', (client) => {
  console.log('Client disconnected from PeerJS server:', client.getId());
  console.log('Remaining connected clients:', peerServer._clients.size);
});

peerServer.on('error', (error) => {
  console.error('PeerJS server error:', error);
});

// Static files
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);

// Direct channel message routes
app.get('/api/channels/:channelId/messages', auth, async (req, res) => {
  console.log('Fetching messages for channel:', req.params.channelId);
  await channelController.getMessages(req, res);
});

app.post('/api/channels/:channelId/messages', auth, async (req, res) => {
  console.log('Adding message to channel:', req.params.channelId);
  await channelController.addMessage(req, res);
});

// Connect to MongoDB
connectDB();

// Create initial super admin
const createSuperAdmin = async () => {
  try {
    const superAdmin = await User.findOne({ username: 'super' });
    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash('123', 10);
      await User.create({
        username: 'super',
        email: 'super@admin.com',
        password: hashedPassword,
        roles: ['super_admin']
      });
      console.log('Super admin created');
    }
  } catch (err) {
    console.error('Error creating super admin:', err);
  }
};

createSuperAdmin();

// Socket.IO connection with token authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
    console.log(`User joined channel: ${channelId}`);
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    console.log(`User left channel: ${channelId}`);
  });

  socket.on('send-message', (message) => {
    console.log('Message received:', message);
    io.to(message.channelId).emit('new-message', message);
  });

  socket.on('join-video-chat', (roomId) => {
    socket.join(`video-${roomId}`);
    console.log(`User joined video chat: ${roomId}`);
  });

  socket.on('leave-video-chat', (roomId) => {
    socket.leave(`video-${roomId}`);
    console.log(`User left video chat: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling for PeerJS
app.use('/peerjs', (err, req, res, next) => {
  console.error('PeerJS error:', err);
  res.status(500).json({ error: 'PeerJS server error' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('PeerJS server mounted on /peerjs');
});