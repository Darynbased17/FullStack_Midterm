require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/trade', require('./routes/trade'));

app.get('/', (req, res) => res.send('PEX API running'));

// ─── WebSocket Server ──────────────────────────────────────────
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    // The client passes JWT via Sec-WebSocket-Protocol header
    const protocol = req.headers['sec-websocket-protocol'];

    // We accept the connection regardless (market data is public)
    // If you wanted private WS data, verify token here with jwt.verify(protocol, ...)
    if (protocol) {
        ws.protocol = protocol; // store token if needed later
    }

    console.log(`WS client connected. Total: ${wss.clients.size}`);

    ws.on('close', () => {
        console.log(`WS client disconnected. Total: ${wss.clients.size}`);
    });

    ws.on('error', (err) => console.error('WS error:', err));
});

// ─── Broadcast function (shared with routes via app.locals) ───
function broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

app.locals.broadcast = broadcast;

// ─── MongoDB + Start ──────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });