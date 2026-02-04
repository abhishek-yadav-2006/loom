import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
let Rooms = new Map();
let socketIds = new Map(); // unique id for each socket
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}
function deleteRoom(ws) {
    Rooms.forEach((clients, RoomId) => {
        if (clients.has(ws)) {
            clients.delete(ws);
        }
        if (clients.size === 0) {
            Rooms.delete(RoomId);
        }
    });
}
export function initws(server) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', (socket) => {
        const id = generateId();
        socketIds.set(socket, id);
        socket.on('message', (data) => {
            console.log("data", data.toString());
            let msg = JSON.parse(data.toString());
            // join rrom
            if (msg.type === 'join-room') {
                const roomId = msg.roomId;
                console.log("roomId", roomId);
                if (!Rooms.has(roomId)) {
                    Rooms.set(roomId, new Set());
                }
                const clients = Rooms.get(roomId);
                clients.add(socket);
                console.log("clients size:", clients.size);
                console.log("clients list:", [...clients]);
                // notify other user tht the new user has joined\\\
                const existingUsers = [...clients];
                existingUsers.filter((s) => s !== socket).map((s) => socketIds.get(s));
                // console.log("existingUsers", existingUsers);
                clients.forEach((s) => {
                    if (s !== socket) {
                        s.send(JSON.stringify(({ type: 'user-joined', userId: id })));
                    }
                });
            }
            if (msg.type === 'chat') {
                const { roomId, message } = msg;
                let clients = Rooms.get(roomId);
                clients?.forEach((s) => {
                    if (s !== socket) {
                        s.send(JSON.stringify({ type: 'chat', userId: id, message }));
                    }
                });
            }
        });
        socket.on('close', () => {
            console.log(`user disconnected!  ${id}`);
            Rooms.forEach((clients, roomId) => {
                if (clients.has(socket)) {
                    clients.delete(socket);
                }
                clients.forEach((s) => {
                    s.send(JSON.stringify({ type: 'user-left', userId: id }));
                });
            });
            deleteRoom(socket);
            socketIds.delete(socket);
        });
    });
}
//# sourceMappingURL=index.js.map