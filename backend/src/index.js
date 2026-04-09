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
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    // Always allow localhost / 127.0.0.1 in development
    if (process.env.NODE_ENV !== 'production' && isLocalOrigin(origin)) return cb(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
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
