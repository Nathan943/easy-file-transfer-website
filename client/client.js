/*
    Client application for the file transfer system
*/


//Websocket connection
const wsUri = "ws://localhost:8080";
let websocket = new WebSocket(wsUri);


//HTML elements
const nameDisplay = document.getElementById("name")

const codeButton = document.getElementById("code_button");
const pairingField = document.getElementById("pairing_field");
const codeDisplay = document.getElementById("code_display");

const fileUpload = document.getElementById("file_upload");
const clientSelection = document.getElementById("client_selection");
const sendButton = document.getElementById("send");


//Intializing vars
var code = null;
const linkedClients = new Map();


//Set up file receiving
var incomingMeta = null;
var incomingChunks = [];


//64kb chunks
const CHUNK_SIZE = 64 * 1024;


//Check if an incoming message is JSON format
function isJson(str) {
    console.log("isJson triggered")
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


//Send file in chunks
function sendFile(file) {
    let counter = 0;

    //Loop through every full chunk and send it
    while (counter + CHUNK_SIZE < file.size) {
        const chunk = file.slice(counter, counter + CHUNK_SIZE);

        websocket.send(chunk);
        counter += CHUNK_SIZE;
        console.log("Chunk sent 64kb");
    }

    //Send the last chunk, which is not a full 64kb
    const last = file.slice(counter, file.size);
    websocket.send(last);

    console.log("Chunk sent %skb", (file.size - counter)/1024);

    //Send end signal
    websocket.send(JSON.stringify({
        signal: 3
    }));
}


//To download received files
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


//Listen for connection
websocket.addEventListener("open", () => {
    console.log("CONNECTED");
});


//Listen for msg from server
websocket.addEventListener("message", (msg) => {

    //Check if msg is file data
    if (!isJson(msg.data)) {

        incomingChunks.push(msg.data);

    } else {

        const parsedMessage = JSON.parse(msg.data);

        /*
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

                //Display pairing code from server
                code = parsedMessage.content;
                codeDisplay.textContent = code;
                break;

            case 1:

                //If no name or id was sent, do nothing (usually means pairing failed)
                if (parsedMessage.content == null) {
                    break;
                }

                //Log connected client
                clientName = parsedMessage.content.client_name;
                clientId = parsedMessage.content.client_id;
                linkedClients.set(clientName, clientId);
                

                //Display connected client
                var option = document.createElement('option');
                option.text = option.value = clientName;
                clientSelection.add(option, 0);
                break;

            case 2:

                //Display name sent from server
                nameDisplay.textContent = "Your name is: " + parsedMessage.content;
                break;

            case 3:

                //Log incoming metadata
                incomingMeta = parsedMessage.content;
                incomingChunks = [];
                break;

            case 4:

                //Rebuild file chunks
                const fileBlob = new Blob(incomingChunks, {
                    type: incomingMeta.type
                });
                createDownloadButton(incomingMeta.name, fileBlob);
                break;
        }
    }
});


//Listen for connection close
websocket.addEventListener("close", () => {
    console.log("DISCONNECTED");
});


//Listen for page close
window.addEventListener("pagehide", () => {
    if (websocket) {
        console.log("CLOSING");
        websocket.close();
        websocket = null;
    }
});


//Listen for connection error
websocket.addEventListener("error", (e) => {
    console.log('ERROR');
});


//Send request for a pairing code
codeButton.addEventListener("click", () => {
    websocket.send(JSON.stringify({
        signal: 0,
        content: ""
    }));
});


//Log which recipient is receiving a file
pairingField.addEventListener("change", () => {
    websocket.send(JSON.stringify({
        signal: 1,
        content: pairingField.value,
    }));
});


//Send a file
sendButton.addEventListener("click", () => {
    const file = fileUpload.files[0];
    if (!file) return;

    //Send metadata
    websocket.send(JSON.stringify({
        signal: 2,
        content: {
            name: file.name,
            type: file.type,
            size: file.size,
            target: linkedClients.get(clientSelection.options[clientSelection.selectedIndex].text)
        }
    }))

    //Send file data
    sendFile(file);
});