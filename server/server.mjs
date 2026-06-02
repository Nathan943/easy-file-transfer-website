import WebSocket, { WebSocketServer } from "ws";
import crypto from "node:crypto";

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map();
const clientAndNames = new Map();
const pairingCodes = new Map();
const sessions = new Map();

function generatePairingCode() {
	let num = "000000" + Math.floor(Math.random() * 999999);
	return num.substring(num.length - 6);
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

wss.on("connection", function connection(ws) {
	//Vars for file transfer
	var canTransfer = false;
	var transferTargets = null;

	let id = "";

	console.log("Total clients: ", clients.size);

	/* 
    When client sends a message
    */
	ws.on("message", (msg, isBinary) => {
		if (isBinary) {
			if (canTransfer && transferTargets) {
				for (const client of transferTargets) {
					client.send(msg);
				}
			}
			return;
		}

		const parsedMessage = JSON.parse(msg.toString());

		/*
        Decide what to do with it
        */
		switch (parsedMessage.signal) {
			case "ON_CLIENT_CONNECT":
				id = parsedMessage.clientId;

				if (!clients.has(id)) {
					clients.set(id, new Set());
				}

				clients.get(id).add(ws);

				//Generate name and store it
				if (!clientAndNames.has(id)) {
					const name = generateName();
					clientAndNames.set(id, name);
					ws.send(
						JSON.stringify({
							signal: "CLIENT_NAME",
							name: name,
						}),
					);
				}

				/*
				Send a list of all previously connected clients and their online statuses
				*/
				const contacts = [];

				const contactsForClient = sessions.get(id) ?? [];
				for (const connectedClientId of contactsForClient) {
					contacts.push({
						id: connectedClientId,
						name: clientAndNames.get(connectedClientId),
						online: clients.has(connectedClientId),
					});

					//If a connected client is online, update it with the new information that this client is now online
					if (clients.has(connectedClientId)) {
						for (const client of clients.get(connectedClientId)) {
							client.send(
								JSON.stringify({
									signal: "CLIENT_STATUS_CHANGE",
									clientId: id,
									online: true,
								}),
							);
						}
					}
				}

				ws.send(
					JSON.stringify({
						signal: "CONTACT_LIST",
						contacts: contacts,
					}),
				);

				break;
			case "REQUEST_PAIRING_CODE":
				let newPairingCode = generatePairingCode();
				//Send code and log it
				ws.send(
					JSON.stringify({
						signal: "PAIRING_CODE",
						pairingCode: newPairingCode,
					}),
				);
				pairingCodes.set(newPairingCode, id);

				//Delete pairing code after 60 seconds
				setTimeout(() => {
					pairingCodes.delete(newPairingCode);
				}, 60000);
				break;

			case "CHANGE_NAME":
				clientAndNames.set(id, parsedMessage.name);

				const connectedClients = sessions.get(id);

				if (connectedClients) {
					for (const targetId of connectedClients) {
						//Each client could have multiple tabs associated with it, so loop through those and alert each tab to the name change
						if (clients.has(targetId)) {
							for (const targetWs of clients.get(targetId)) {
								targetWs.send(
									JSON.stringify({
										signal: "CLIENT_NAME_CHANGED",
										clientId: id,
										name: parsedMessage.name,
									}),
								);
							}
						}
					}
				}

				break;
			case "CONNECT_WITH_CLIENT":
				//Check if valid pairing code
				if (pairingCodes.has(parsedMessage.pairingCode)) {
					console.log("Connected!");

					//Get id of the target to pair with
					const targetId = pairingCodes.get(
						parsedMessage.pairingCode,
					);

					if (targetId == id) {
						ws.send(
							JSON.stringify({
								signal: "CONNECTED_CLIENT_INFO",
								clientId: null,
								clientName: null,
							}),
						);

						return;
					}

					//Link two clients by id
					linkSession(id, targetId);

					ws.send(
						JSON.stringify({
							signal: "CONNECTED_CLIENT_INFO",
							clientId: targetId,
							clientName: clientAndNames.get(targetId),
						}),
					);

					if (clients.has(targetId)) {
						for (const client of clients.get(targetId)) {
							client.send(
								JSON.stringify({
									signal: "CONNECTED_CLIENT_INFO",
									clientId: id,
									clientName: clientAndNames.get(id),
								}),
							);
						}
					}
				} else {
					//Pairing code expired or does not exist
					console.log("Unsuccessful connection");
					ws.send(
						JSON.stringify({
							signal: "CONNECTED_CLIENT_INFO",
							clientId: null,
							clientName: null,
						}),
					);
				}
				break;
			case "FILE_META":
				if (canTransfer) break;

				//Check if the clients are allowed to transfer files
				for (const [key, value] of sessions) {
					if (key == id) {
						for (const x of value) {
							if (x == parsedMessage.targetClientId) {
								canTransfer = true;

								transferTargets = clients.get(x);
								if (!transferTargets) break;

								for (const client of transferTargets) {
									client.send(
										JSON.stringify({
											signal: "FILE_META",
											client: {
												id,
												name: clientAndNames.get(id),
											},
											name: parsedMessage.name,
											type: parsedMessage.type,
											size: parsedMessage.size,
										}),
									);
								}
							}
						}
					}
				}

				break;
			case "FILE_END":
				if (!transferTargets) break;

				for (const client of transferTargets) {
					client.send(
						JSON.stringify({
							signal: "FILE_END",
						}),
					);
				}

				canTransfer = false;
				transferTargets = null;
				break;
		}
	});

	/* 
    When client is disconnected
    */

	ws.on("close", function close() {
		console.log("close received");

		//Delete the current tab connection
		const sockets = clients.get(id);

		if (sockets) {
			sockets.delete(ws);

			if (sockets.size == 0) {
				const contactsForClient = sessions.get(id) ?? [];

				for (const connectedClientId of contactsForClient) {
					//When this client goes offline, update all other connections with the new information
					if (clients.has(connectedClientId)) {
						for (const connectedClient of clients.get(
							connectedClientId,
						)) {
							connectedClient.send(
								JSON.stringify({
									signal: "CLIENT_STATUS_CHANGE",
									clientId: id,
									online: false,
								}),
							);
						}
					}
				}

				clients.delete(id);
			}
		}
	});
});
