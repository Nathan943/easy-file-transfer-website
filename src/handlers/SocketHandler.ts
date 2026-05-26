/*
    Client application for the file transfer system
*/

import { Client, IncomingFile, Message } from "../types/types";

//Websocket connection
class SocketHandler {
	private socket: WebSocket | null = null;

	private incomingFile: IncomingFile | null = null;

	private linkedClients: Client[] = [];
	private currentClient: Client | null = null;

	private onPairCodeReceivedCallback?: (code: number) => void;
	private onNameReceivedCallback?: (name: string) => void;
	private onClientConnectedCallback?: (client: Client) => void;
	private onFileReceivedCallback?: (client: Client, file: File) => void;

	connect() {
		this.socket = new WebSocket("ws://localhost:8080");

		this.socket.addEventListener("open", () => {
			console.log("CONNECTED");
		});

		this.socket.addEventListener("message", (msg) => {
			//Check for raw file data first
			if (typeof msg.data !== "string") {
				if (!this.incomingFile) return;

				this.incomingFile.chunks.push(msg.data);
				return;
			}

			//If not raw file data, parse the JSON message
			const parsedMessage = JSON.parse(msg.data);

			//And decide what to do with the message
			switch (parsedMessage.signal) {
				case "PAIRING_CODE":
					//Display pairing code from server
					const pairingCode = parsedMessage.pairingCode;
					this.onPairCodeReceivedCallback?.(pairingCode);
					break;
				case "SELF_NAME":
					//Display name sent from server
					this.onNameReceivedCallback?.(parsedMessage.name);
					break;
				case "CONNECTED_CLIENT_INFO":
					//If no name or id was sent, do nothing (usually means pairing failed)
					if (parsedMessage.clientId == null) break;

					//Log connected client
					const newClient: Client = {
						id: parsedMessage.clientId,
						name: parsedMessage.clientName,
					};

					this.linkedClients.push(newClient);
					this.onClientConnectedCallback?.(newClient);
					break;
				case "FILE_META":
					//Don't log new metadata if a file is still being sent
					if (this.incomingFile) break;

					//Log client
					this.currentClient = parsedMessage.client;

					//Log metadata
					this.incomingFile = {
						name: parsedMessage.name,
						type: parsedMessage.type,
						size: parsedMessage.size,
						chunks: [],
					};
					break;
				case "FILE_END":
					if (!this.incomingFile) break;

					//Reconstruct the file
					const reconstructedBlob = new Blob(
						this.incomingFile.chunks,
						{ type: this.incomingFile.type },
					);

					const reconstructedFile = new File(
						[reconstructedBlob],
						this.incomingFile.name,
						{ type: this.incomingFile.type },
					);

					if (!this.currentClient) break;

					this.onFileReceivedCallback?.(
						this.currentClient,
						reconstructedFile,
					);

					this.incomingFile = null;
					this.currentClient = null;

					break;
			}
		});

		this.socket.addEventListener("close", () => {
			console.log("DISCONNECTED");
		});

		this.socket.addEventListener("error", () => {
			console.log("ERROR");
		});
	}

	disconnect() {
		this.socket?.close();
	}

	send(data: any) {
		this.socket?.send(data);
	}

	onPairCodeReceived(callback: (code: number) => void) {
		this.onPairCodeReceivedCallback = callback;
	}

	onNameReceived(callback: (name: string) => void) {
		this.onNameReceivedCallback = callback;
	}

	onClientConnected(callback: (client: Client) => void) {
		this.onClientConnectedCallback = callback;
	}

	onFileReceived(callback: (client: Client, file: File) => void) {
		this.onFileReceivedCallback = callback;
	}
}

export default new SocketHandler();

//Intializing vars
var code = null;

//128kb chunks
const CHUNK_SIZE = 128 * 1024;

const uploadQueue = [];
const filesWithIds = new Map();
var uploading = false;

function processQueue() {
	if (uploading) return;
	if (uploadQueue.length == 0) return;

	uploading = true;
	const fileId = uploadQueue.shift();
	const file = filesWithIds.get(fileId);
	filesWithIds.delete(fileId);

	//Send metadata
	websocket.send(
		JSON.stringify({
			signal: 3,
			name: file.name,
			type: file.type,
			size: file.size,
			target: linkedClients.get(
				clientSelection.options[clientSelection.selectedIndex].text,
			),
		}),
	);

	//Send file data
	sendFile(file, fileId);
}

//Send file in chunks
function sendFile(file, fileId) {
	let counter = 0;

	function sendChunk() {
		if (counter + CHUNK_SIZE < file.size) {
			//Loop through every full chunk and send it
			//Get chunk to send
			const chunk = file.slice(counter, counter + CHUNK_SIZE);

			websocket.send(chunk);

			counter += CHUNK_SIZE;
			updateProgressBar(
				file.name,
				fileId,
				Math.round((counter / file.size) * 100),
			);
			console.log("Chunk sent 128kb");

			setTimeout(sendChunk, 0);
		} else {
			//Send the last chunk, which is not a full 64kb
			const last = file.slice(counter, file.size);
			websocket.send(last);

			updateProgressBar(file.name, fileId, 100);
			console.log("Chunk sent %skb", (file.size - counter) / 1024);

			//Send end signal
			websocket.send(
				JSON.stringify({
					signal: 4,
				}),
			);

			//Start the next upload if there is one queued
			uploading = false;
			processQueue();
		}
	}

	sendChunk();
}

//Listen for msg from server
websocket.addEventListener("message", (msg) => {
	if (!isJson(msg.data)) {
		if (!incomingFile) return;

		incomingFile.chunks.push(msg.data);
		progressCounter++;
		return;
	}

	const parsedMessage = JSON.parse(msg.data);

	/*
        What data am I receiving?
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
			var option = document.createElement("option");
			option.text = option.value = clientName;
			clientSelection.add(option, 0);
			break;

		case 2:
			//Display name sent from server
			nameDisplay.textContent = "Your name is: " + parsedMessage.content;
			break;

		case 3:
			//If another file tries to send at the same time
			if (incomingFile) {
				return;
			}

			const name = parsedMessage.name;
			const type = parsedMessage.type;
			const size = parsedMessage.size;
			incomingFile = {
				name,
				type,
				size,
				chunks: [],
			};

			break;

		case 4:
			if (!incomingFile) return;

			const fileBlob = new Blob(incomingFile.chunks, {
				type: incomingFile.type,
			});
			createDownloadButton(incomingFile.name, fileBlob);
			incomingFile = null;

			break;
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
	console.log("ERROR");
});

//Send request for a pairing code
codeButton.addEventListener("click", () => {
	websocket.send(
		JSON.stringify({
			signal: 0,
			content: "",
		}),
	);
});

//Log which recipient is receiving a file
pairingField.addEventListener("change", () => {
	websocket.send(
		JSON.stringify({
			signal: 1,
			content: pairingField.value,
		}),
	);
});

//Send a file
sendButton.addEventListener("click", () => {
	const file = fileUpload.files[0];
	if (!file) return;

	const fileId = crypto.randomUUID();
	filesWithIds.set(fileId, file);

	createProgressBar(file.name, fileId);
	uploadQueue.push(fileId);
	processQueue();
});
