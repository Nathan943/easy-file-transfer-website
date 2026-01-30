const wsUri = "ws://localhost:8080";
const websocket = new WebSocket(wsUri);

let counter = 0;

const message = {
    iteration: counter,
    content: "ping",
};

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


websocket.addEventListener("open", () => {
    console.log("CONNECTED");
    pingInterval = setInterval(() => {
        console.log(`SENT: ping: ${counter}`);
        websocket.send(JSON.stringify({
            iteration: counter,
            content: "ping"
        }));
        counter++;
    }, 1000);
});

websocket.addEventListener("message", (msg) => {
    if (isJson(msg.data)) {
        const message = JSON.parse(msg.data);
        console.log(`RECIEVED: ${message.iteration}: ${message.content}`);
    } else {
        console.log("RECEIVED %s", msg.data);
    }
});

websocket.addEventListener("close", () => {
    console.log("DISCONNECTED");
    clearInterval(pingInterval);
});

window.addEventListener("pagehide", () => {
    if (websocket) {
        console.log("CLOSING");
        websocket.close();
        websocket = null;
        window.clearInterval(pingInterval);
    }
});

websocket.addEventListener("error", (e) => {
    console.log('ERROR');
});