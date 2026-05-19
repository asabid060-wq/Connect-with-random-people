const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let waitingUser = null;

io.on('connection', (socket) => {
    socket.on('find_partner', () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const partner = waitingUser;
            waitingUser = null;

            socket.emit('match_found', { partnerId: partner.id, initiate: true });
            partner.emit('match_found', { partnerId: socket.id, initiate: false });
        } else {
            waitingUser = socket;
            socket.emit('waiting', 'Searching for a partner...');
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
