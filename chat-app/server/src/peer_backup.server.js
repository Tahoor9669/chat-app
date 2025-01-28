const { PeerServer } = require('peer');

// Create PeerJS server
const peerServer = PeerServer({
    port: 9000,
    path: '/peerjs',
    proxied: true,
    debug: true,
    ssl: {
        key: null,
        cert: null
    },
    corsOptions: {
        origin: 'http://localhost:4200', // Your Angular app URL
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
});

// Connection event
peerServer.on('connection', (client) => {
    console.log('Client connected to peer server:', client.id);
    console.log('Total connected clients:', peerServer._clients.size);
});

// Disconnect event
peerServer.on('disconnect', (client) => {
    console.log('Client disconnected from peer server:', client.id);
    console.log('Remaining connected clients:', peerServer._clients.size);
});

// Error handling
peerServer.on('error', (error) => {
    console.error('PeerServer error:', error);
});

// Export the PeerServer instance and a method to get it
module.exports = {
    peerServer,
    getPeerServer: () => peerServer
};