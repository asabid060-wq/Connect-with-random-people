const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const LIVEKIT_URL = "wss://gtman-vjnbbcnr.livekit.cloud";
const LIVEKIT_API_KEY = "APIR7Zd58gejbt2";
const LIVEKIT_SECRET_KEY = "আপনার_Secret_Key_এখানে_বসাবেন";

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    socket.on('find_partner', async () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const partner = waitingUser;
            waitingUser = null;

            const roomName = `room_${socket.id}_${partner.id}`;

            try {
                const token1 = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_SECRET_KEY, { identity: socket.id });
                token1.addGrant({ roomJoin: true, room: roomName });
                const userToken1 = await token1.toJwt();

                const token2 = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_SECRET_KEY, { identity: partner.id });
                token2.addGrant({ roomJoin: true, room: roomName });
                const userToken2 = await token2.toJwt();

                socket.emit('match_found', { url: LIVEKIT_URL, token: userToken1 });
                partner.emit('match_found', { url: LIVEKIT_URL, token: userToken2 });
                
                console.log(`Matched via LiveKit Room: ${roomName}`);
            } catch (err) {
                console.error('Error generating LiveKit Token:', err);
            }
        } else {
            waitingUser = socket;
            socket.emit('waiting', 'Searching for a partner...');
            console.log(`${socket.id} is waiting for a partner.`);
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) {
            waitingUser = null;
        }
        console.log('User disconnected: ' + socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
