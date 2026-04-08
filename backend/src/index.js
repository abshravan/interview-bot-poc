require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { connectDB } = require('./config/db');
const { handleInterviewSocket } = require('./services/geminiService');

const resumeRoutes = require('./routes/resume');
const sessionRoutes = require('./routes/sessions');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const server = http.createServer(app);

// WebSocket server (path: /ws/interview)
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    ws.close(1008, 'sessionId query param is required');
    return;
  }

  handleInterviewSocket(ws, sessionId);
});

// Upgrade HTTP → WebSocket only for /ws/interview
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/ws/interview')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/resume', resumeRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);

// Start
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
