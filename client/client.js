const wsUri = "ws://localhost:8080";
let websocket = new WebSocket(wsUri);

const codeDisplay = document.getElementById("code_display");
const pairingStatus = document.getElementById("pairing_status");

var code = null;

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
});

websocket.addEventListener("message", (msg) => {
    const incomingMessage = JSON.parse(msg.data);
    switch (incomingMessage.signal) {
        case 0:
            code = incomingMessage.content;
            codeDisplay.textContent = code;
            break;
        case 1:
            pairingStatus.textContent = incomingMessage.content;
            break;
    }
});

websocket.addEventListener("close", () => {
    console.log("DISCONNECTED");
});

window.addEventListener("pagehide", () => {
    if (websocket) {
        console.log("CLOSING");
        websocket.close();
        websocket = null;
    }
});

websocket.addEventListener("error", (e) => {
    console.log('ERROR');
});

const codeButton = document.getElementById("code_button");

codeButton.addEventListener("click", () => {
    websocket.send(JSON.stringify({
        signal: 0,
        content: ""
    }));
});

const pairingField = document.getElementById("pairing_field");

pairingField.addEventListener("change", () => {
    websocket.send(JSON.stringify({
        signal: 1,
        content: pairingField.value
    }));
});