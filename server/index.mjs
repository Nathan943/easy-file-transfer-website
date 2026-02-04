import { clearInterval } from 'node:timers';
import WebSocket, { WebSocketServer } from 'ws';
import crypto from "node:crypto";

const wss = new WebSocketServer({port: 8080});

const clients = new Map();
const pairingCodes = new Map();

function generatePairingCode() {
    let num = "000000" + Math.floor(Math.random() * 999999);
    return num.substring(num.length-6);
}

wss.on('connection', function connection(ws) {
    const id = crypto.randomUUID();
    clients.set(id, ws);

    console.log("Total clients: ", clients.size);


    ws.on('message', (msg) => {
        const incomingMessage = JSON.parse(msg.toString());
        switch (incomingMessage.signal) {
            case 0:
                let newPairingCode = generatePairingCode();

                ws.send(JSON.stringify({
                    signal: 0,
                    content: newPairingCode
                }));
                pairingCodes.set(newPairingCode, id);

                setTimeout(() => {
                    pairingCodes.delete(newPairingCode);
                }, 60000);
                break;
            case 1:
                console.log("Received pairing request from client %s: %s", id, incomingMessage.content);
                if (pairingCodes.has(incomingMessage.content)) {
                    const targetId = pairingCodes.get(incomingMessage.content);
                    console.log("Successful connection from client %s to client %s", id, targetId);

                    ws.send(JSON.stringify({
                        signal: 1,
                        content: "Connected!"
                    }));

                    pairingCodes.delete(incomingMessage.content);
                } else {
                    console.log("Unsuccessful connection");
                    ws.send(JSON.stringify({
                        signal: 1,
                        content: "Unsuccessful connection"
                    }));
                }
        }
    });

    ws.on('close', function close() {
        console.log("close received");
        clients.delete(id);
        pairingCodes.delete(id);
    });
});