const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { execSync } = require('child_process');
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');

dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();
const server = http.createServer(app);

// Socket.io Setup (Real-time Engine)
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (phone access via IP)
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,      // Wait 60s for pong before considering disconnected (default 5s is too aggressive)
    pingInterval: 25000,     // Send ping every 25s to keep connection alive
    transports: ['websocket', 'polling'], // Support both transports  
    allowUpgrades: true
});

// Apply Middleware
app.use(cors());
app.use(express.json());

// Inject Socket.io into Request object so Controllers can use it
app.use((req, res, next) => {
    req.app.set('socketio', io);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes); // Menu Management (w/ Auto-Disable)
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));

// Home Route
app.get('/', (req, res) => {
    res.send('Smart Restaurant API is running...');
});

// Error Handling Middleware (Prevent Crashes)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON received:', err.message);
        return res.status(400).send({ message: 'Invalid JSON payload' });
    }
    console.error(err.stack);
    res.status(500).send({ message: 'Internal Server Error' });
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log(`New Client Connected: ${socket.id}`);

    // Join a specific table room (e.g., "table-5")
    socket.on('join_table', (tableId) => {
        socket.join(`table-${tableId}`);
        console.log(`Socket ${socket.id} joined table-${tableId}`);
    });

    socket.on('call_waiter', (data) => {
        console.log(`Table ${data.tableId} called a waiter`);
        io.emit('waiter_called', data);
    });

    // When waiter updates a table (clear, mark paid, etc.), broadcast to all screens
    socket.on('table_update_from_waiter', () => {
        io.emit('table_update', {});
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;

// ── Auto-fix port conflicts & start server (Windows dev only) ──
const killProcessOnPort = (port) => {
    if (process.platform !== 'win32') return false;
    try {
        const result = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, { encoding: 'utf-8' });
        const lines = result.trim().split('\n');
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && pid !== String(process.pid)) {
                console.log(`⚠️  Port ${port} is busy (PID ${pid}). Killing old process...`);
                execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf-8' });
                console.log(`✅ Killed PID ${pid}`);
            }
        }
        return true;
    } catch (e) {
        // No process found on port — all clear
        return false;
    }
};

const startServer = () => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT} (network accessible)`);
    });
};

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use. Attempting auto-fix...`);
        killProcessOnPort(PORT);
        // Wait 1 second for port to free up, then retry
        setTimeout(() => {
            server.close();
            startServer();
        }, 1000);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

// ── Graceful shutdown (prevents zombie processes) ──
const gracefulShutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    io.close();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    // Force exit after 3s if graceful shutdown hangs
    setTimeout(() => process.exit(0), 3000);
};

process.on('SIGINT', gracefulShutdown);   // Ctrl+C
process.on('SIGTERM', gracefulShutdown);  // Kill command

startServer();
