import { clearInterval } from 'node:timers';
import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 8080});

let counter = 0;

wss.on('connection', function connection(wss) {
    wss.on('message', (msg) => {
        const incomingMessage = JSON.parse(msg.toString());
        console.log(`RECIEVED: ${incomingMessage.iteration}: ${incomingMessage.content}`);
    });

    wss.send('connection received');

    var t = setInterval(function() {
        console.log("sending message: \"HELLO THERE!\"");
        wss.send(JSON.stringify({
            iteration: counter,
            content: "HELLO THERE!"
        }));
        counter--;
    }, 1000);

    wss.on('close', function close() {
        console.log("received close");
        clearInterval(t);
    });
});