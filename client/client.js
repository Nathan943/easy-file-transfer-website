const wsUri = "ws://localhost:8080";
let websocket = new WebSocket(wsUri);

const nameDisplay = document.getElementById("name")

const codeButton = document.getElementById("code_button");
const pairingField = document.getElementById("pairing_field");
const codeDisplay = document.getElementById("code_display");

const clientSelection = document.getElementById("client_selection");
const sendButton = document.getElementById("send");


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
            if (incomingMessage.content == null) {
                break;
            }

            //Make button
            var option = document.createElement('option');
            option.text = option.value = incomingMessage.content;
            clientSelection.add(option, 0);
            break;
        case 2:
            nameDisplay.textContent = "Your name is: " + incomingMessage.content
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


codeButton.addEventListener("click", () => {
    websocket.send(JSON.stringify({
        signal: 0,
        content: ""
    }));
});

pairingField.addEventListener("change", () => {
    websocket.send(JSON.stringify({
        signal: 1,
        content: pairingField.value,
    }));
});