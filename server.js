const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    socket.on('find_partner', () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const partner = waitingUser;
            waitingUser = null;

            socket.emit('match_found', { partnerId: partner.id, initiate: true });
            partner.emit('match_found', { partnerId: socket.id, initiate: false });
            console.log(`Matched: ${socket.id} with ${partner.id}`);
        } else {
            waitingUser = socket;
            socket.emit('waiting', 'Searching for a partner...');
            console.log(`${socket.id} is waiting for a partner.`);
        }
    });

    // ভয়েস সিগন্যালিং পাস করার নতুন কোড
    socket.on('offer', (data) => {
        io.to(data.target).emit('offer', { offer: data.offer, sender: socket.id });
    });

    socket.on('answer', (data) => {
        io.to(data.target).emit('answer', { answer: data.answer, sender: socket.id });
    });

    socket.on('ice_candidate', (data) => {
        io.to(data.target).emit('ice_candidate', { candidate: data.candidate, sender: socket.id });
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) {
            waitingUser = null;
        }
        console.log('User disconnected: ' + socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
