// import { sign } from "node:crypto";

const wsUri = "ws://localhost:8080";
let websocket = new WebSocket(wsUri);

const nameDisplay = document.getElementById("name")

const codeButton = document.getElementById("code_button");
const pairingField = document.getElementById("pairing_field");
const codeDisplay = document.getElementById("code_display");

const fileUpload = document.getElementById("file_upload");
const clientSelection = document.getElementById("client_selection");
const sendButton = document.getElementById("send");


var code = null;
const linkedClients = new Map();


var incomingMeta = null;
var incomingChunks = [];


function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


function sliceFile(file) {

}

function createDownloadButton(name, blob) {
    const btn  = document.createElement("button");
    btn.textContent = name;

    btn.onclick = () => {
        const url = URL.createObjectURL(blob);

        const download = document.createElement("a");
        download.href = url;
        download.download = name;
        download.click();

        URL.revokeObjectURL(url);
    };

    document.body.append(btn);
}

websocket.addEventListener("open", () => {
    console.log("CONNECTED");
});

websocket.addEventListener("message", (msg) => {

    if (!isJson(msg.data)) {
        incomingChunks.push(msg.data);
    } else {

        const parsedMessage = JSON.parse(msg.data);

        /*
            First check if raw data is being sent

            What data is being sent?
            Signals:
                0 - Pairing code
                1 - Other client name and id
                2 - Generated name
                3 - Incoming file metadata
                4 - File transfer done
        */
        switch (parsedMessage.signal) {
            case 0:
                code = parsedMessage.content;
                codeDisplay.textContent = code;
                break;
            case 1:
                if (parsedMessage.content == null) {
                    break;
                }
                clientName = parsedMessage.content.client_name;
                clientId = parsedMessage.content.client_id;

                linkedClients.set(clientName, clientId);
                

                //Make button
                var option = document.createElement('option');
                option.text = option.value = clientName;
                clientSelection.add(option, 0);
                break;
            case 2:
                nameDisplay.textContent = "Your name is: " + parsedMessage.content;
                break;
            case 3:
                incomingMeta = parsedMessage.content;
                incomingChunks = [];
                break;
            case 4:
                const fileBlob = new Blob(incomingChunks, {
                    type: incomingMeta.type
                });
                createDownloadButton(incomingMeta.name, fileBlob);
        }
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

sendButton.addEventListener("click", () => {
    const file = fileUpload.files[0];
    if (!file) return;
    
    var reader = new FileReader();

    reader.onload = function (e) {
        const rawData = e.target.result;
        console.log(clientSelection.options[clientSelection.selectedIndex].text);
        websocket.send(JSON.stringify({
            signal: 2,
            content: {
                name: file.name,
                type: file.type,
                size: file.size,
                target: linkedClients.get(clientSelection.options[clientSelection.selectedIndex].text)
            }
        }))

        websocket.send(rawData);

        websocket.send(JSON.stringify({
            signal: 3
        }));
    }

    reader.readAsArrayBuffer(file);
});