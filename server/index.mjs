import { clearInterval } from 'node:timers';
import WebSocket, { WebSocketServer } from 'ws';
import crypto from "node:crypto";
import { link } from 'node:fs';

const wss = new WebSocketServer({port: 8080});

const clients = new Map();
const clientAndNames = new Map();
const pairingCodes = new Map();
const sessions = new Map();


function generatePairingCode() {
    let num = "000000" + Math.floor(Math.random() * 999999);
    return num.substring(num.length-6);
}


function generateName() {
    let name = "";
    for (var i = 0; i < 4; i++) {
        let num = Math.floor(Math.random() * 26) + 97;
        name += String.fromCharCode(num);
    }
    return name;
}


function linkSession(id1, id2) {
    if (!sessions.has(id1)) {
        sessions.set(id1, new Set());
    }
    if (!sessions.has(id2)) {
        sessions.set(id2, new Set());
    }

    sessions.get(id1).add(id2);
    sessions.get(id2).add(id1);
}

/* 
When client is connected
*/

wss.on('connection', function connection(ws) {
    //Generate client id and store it
    const id = crypto.randomUUID();
    clients.set(id, ws);

    //Generate name and store it
    const name = generateName();
    clientAndNames.set(id, name);
    ws.send(JSON.stringify({
        signal: 2,
        content: name
    }));


    console.log("Total clients: ", clients.size);


    /* 
    When client sends a message
    */
    ws.on('message', (msg) => {
        //Parse message
        const incomingMessage = JSON.parse(msg.toString());

        //Decide what to do with it
        /*
        Signals:
            0 - Generate pairing code for the client
            1 - Connect with another client through pairing code
        */
        switch (incomingMessage.signal) {
            case 0:
                let newPairingCode = generatePairingCode();

                //Send code and log it
                ws.send(JSON.stringify({
                    signal: 0,
                    content: newPairingCode
                }));
                pairingCodes.set(newPairingCode, id);

                //Delete pairing code after 60 seconds
                setTimeout(() => {
                    pairingCodes.delete(newPairingCode);
                }, 60000);
                break;
            case 1:
                console.log("Received pairing request from client %s: %s", id, incomingMessage.content);

                //Check if valid pairing code
                if (pairingCodes.has(incomingMessage.content)) {
                    console.log("Connected!");

                    //Get id of the target to pair with
                    const targetId = pairingCodes.get(incomingMessage.content);

                    //Link two clients by id
                    linkSession(id, targetId);

                    ws.send(JSON.stringify({
                        signal: 1,
                        content: clientAndNames.get(targetId)
                    }));
                    clients.get(targetId).send(JSON.stringify({
                        signal: 1,
                        content: clientAndNames.get(id)
                    }));

                    for (const [key, value] of sessions) {
                        console.log("%s: %s", key, value);
                    }

                } else {

                    //Pairing code expired or does not exist
                    console.log("Unsuccessful connection");
                    ws.send(JSON.stringify({
                        signal: 1,
                        content: null
                    }));
                }
        }
    });



    /* 
    When client is disconnected
    */

    ws.on('close', function close() {
        console.log("close received");
        clients.delete(id);
        pairingCodes.delete(id);
    });
});