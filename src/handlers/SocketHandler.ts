/*
    Client application for the file transfer system
*/

import { Client, IncomingFile, QueuedUpload } from "../types/types";

//128 kb chunks
const CHUNK_SIZE = 128 * 1024;

//Websocket connection
class SocketHandler {
	private socket: WebSocket | null = null;

	private clientId = "";

	private incomingFile: IncomingFile | null = null;

	private linkedClients: Client[] = [];
	private currentClient: Client | null = null;

	private onPairCodeReceivedCallback?: (code: number) => void;
	private onNameReceivedCallback?: (name: string) => void;
	private onClientConnectedCallback?: (client: Client) => void;
	private onFileReceivedCallback?: (client: Client, file: File) => void;
	private onContactsReceivedCallback?: (contacts: Client[]) => void;
	private onClientOnlineStatusChangeCallback?: (
		targetClientId: string,
		online: boolean,
	) => void;
	private onNameChangedCallback?: (
		targetClientId: string,
		name: string,
	) => void;

	private uploadQueue: QueuedUpload[] = [];
	private uploading: boolean = false;

	connect(clientId: string) {
		this.socket = new WebSocket("ws://localhost:8080");
		this.clientId = clientId;

		this.socket.addEventListener("open", () => {
			console.log("CONNECTED");
			this.socket?.send(
				JSON.stringify({
					signal: "ON_CLIENT_CONNECT",
					clientId: this.clientId,
				}),
			);
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
				case "CLIENT_NAME":
					//Display name sent from server
					this.onNameReceivedCallback?.(parsedMessage.name);
					break;

				case "CLIENT_NAME_CHANGED":
					console.log("client name change");
					this.onNameChangedCallback?.(
						parsedMessage.clientId,
						parsedMessage.name,
					);
					break;

				case "CONTACT_LIST":
					/*
					Go through the list of contacts and send the information to App to be displayed
					*/
					this.onContactsReceivedCallback?.(parsedMessage.contacts);
					break;

				case "CLIENT_STATUS_CHANGE":
					this.onClientOnlineStatusChangeCallback?.(
						parsedMessage.clientId,
						parsedMessage.online,
					);
					break;

				case "CONNECTED_CLIENT_INFO":
					//If no name or id was sent, do nothing (usually means pairing failed)
					if (parsedMessage.clientId == null) break;

					//Log connected client
					const newClient: Client = {
						id: parsedMessage.clientId,
						name: parsedMessage.clientName,
						online: true,
					};

					this.onClientConnectedCallback?.(newClient);
					break;

				case "FILE_META":
					console.log("meta received");
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

	getPairingCode = () => {
		this.socket?.send(
			JSON.stringify({
				signal: "REQUEST_PAIRING_CODE",
			}),
		);
	};

	editName = (name: string) => {
		this.socket?.send(
			JSON.stringify({
				signal: "CHANGE_NAME",
				name: name,
			}),
		);
	};

	connectWithClient = (pairingCode: string) => {
		this.socket?.send(
			JSON.stringify({
				signal: "CONNECT_WITH_CLIENT",
				pairingCode: pairingCode,
			}),
		);
	};

	send(file: File, targetClient: Client) {
		if (!file) return;
		if (!targetClient) return;

		//Add file to a queue
		this.uploadQueue.push({ file: file, targetClient: targetClient });

		if (this.uploading) return;
		if (this.uploadQueue.length == 0) return;

		this.processQueue();
	}

	//Process the file queue
	private processQueue() {
		if (this.uploading) return;
		if (this.uploadQueue.length == 0) return;

		const uploadData = this.uploadQueue.shift();

		if (!uploadData) return;

		this.uploading = true;

		//Send file data
		this.sendFile(uploadData);
	}

	//Send file in chunks
	private sendFile(uploadData: QueuedUpload) {
		let counter = 0;

		const file = uploadData.file;

		//Send metadata
		this.socket?.send(
			JSON.stringify({
				signal: "FILE_META",
				name: file.name,
				type: file.type,
				size: file.size,
				targetClientId: uploadData.targetClient.id,
			}),
		);

		const sendChunk = () => {
			if (!this.socket || this.socket.readyState != WebSocket.OPEN) {
				this.uploading = false;
				return;
			}

			if (counter + CHUNK_SIZE < file.size) {
				//Loop through every full chunk and send it
				//Get chunk to send
				const chunk = file.slice(counter, counter + CHUNK_SIZE);

				this.socket?.send(chunk);

				counter += CHUNK_SIZE;
				console.log("Chunk sent 128kb");

				setTimeout(sendChunk, 0);
			} else {
				//Send the last chunk, which is not a full 64kb
				const last = file.slice(counter, file.size);
				this.socket?.send(last);

				console.log("Chunk sent %skb", (file.size - counter) / 1024);

				//Send end signal
				this.socket?.send(
					JSON.stringify({
						signal: "FILE_END",
					}),
				);

				//Start the next upload if there is one queued
				this.uploading = false;
				this.processQueue();
			}
		};

		sendChunk();
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

	onNameChanged(callback: (targetClientId: string, name: string) => void) {
		this.onNameChangedCallback = callback;
	}

	onContactsReceived(callback: (contacts: Client[]) => void) {
		this.onContactsReceivedCallback = callback;
	}

	onClientOnlineStatusChange(
		callback: (targetClientId: string, online: boolean) => void,
	) {
		this.onClientOnlineStatusChangeCallback = callback;
	}
}

export default new SocketHandler();
