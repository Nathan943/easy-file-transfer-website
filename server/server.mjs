import WebSocket, { WebSocketServer } from "ws";
import crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as syncFs from "node:fs";

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map();
const clientAndNames = new Map();
const pairingCodes = new Map();
const sessions = new Map();
const busyClients = new Set();

const publicKeys = new Map();

const adjectives = (await fs.readFile("../src/names/adjectives.txt", "utf-8"))
	.split(/\r?\n/)
	.filter(Boolean);
const animals = (await fs.readFile("../src/names/animals.txt", "utf-8"))
	.split(/\r?\n/)
	.filter(Boolean);

//Create a pairing code for the client
function generatePairingCode() {
	let num = "000000" + Math.floor(Math.random() * 999999);
	return num.substring(num.length - 6);
}

//Create a name for the client
function generateName() {
	const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
	const animal = animals[Math.floor(Math.random() * animals.length)];

	return adjective + " " + animal;
	//   let name = "";
	//   for (var i = 0; i < 4; i++) {
	//     let num = Math.floor(Math.random() * 26) + 97;
	//     name += String.fromCharCode(num);
	//   }
	//   return name;
}

//Log the connection between two clients
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

async function loadData() {
	if (!syncFs.existsSync("../src/data/clients.json")) return;

	const data = await fs.readFile("../src/data/clients.json", "utf-8");

	const savedClients = data.trim() ? JSON.parse(data) : [];

	//Load data for each client
	for (const client of savedClients) {
		clientAndNames.set(client.id, client.name);
		sessions.set(client.id, new Set(client.contacts));
	}
}

async function saveData() {
	const savedClients = [];

	for (const [id, name] of clientAndNames) {
		savedClients.push({
			id,
			name,
			contacts: [...(sessions.get(id) ?? [])],
		});
	}

	await fs.writeFile(
		"../src/data/clients.json",
		JSON.stringify(savedClients, null, 2),
	);
}

await loadData();

/* 
When client is connected
*/
wss.on("connection", function connection(ws) {
	//Vars for file transfer
	var canTransfer = false;
	var transferTargets = null;
	var currentMessageId = null;
	var currentTargetClientId = null;

	let id = "";

	console.log("Total clients: ", clients.size + 1);

	/* 
    When client sends a message
    */
	ws.on("message", async (msg, isBinary) => {
		//Check for file data
		if (isBinary) {
			//Send the data to the first instance of the target client
			if (canTransfer && transferTargets) {
				if (transferTargets[0].readyState == WebSocket.OPEN) {
					transferTargets[0].send(msg);
				} else {
					ws.send(
						JSON.stringify({
							signal: "FILE_FAILED",
							messageId: currentMessageId,
						}),
					);

					//If there are still other instances of the target client open, tell them the transfer with the original one failed
					if (transferTargets) {
						for (const target of transferTargets) {
							target.send(
								JSON.stringify({
									signal: "FILE_FAILED",
									messageId: currentMessageId,
								}),
							);
						}
					}

					if (currentTargetClientId) {
						busyClients.delete(currentTargetClientId);
						currentTargetClientId = null;
					}

					canTransfer = false;
					transferTargets = null;
					currentMessageId = null;
				}
			}
			return;
		}

		//Otherwise, parse the JSON message
		const parsedMessage = JSON.parse(msg.toString());

		/*
        Decide what to do with it
        */
		switch (parsedMessage.signal) {
			case "ON_CLIENT_CONNECT":
				console.log(
					`MESSAGE RECEIVED: ON_CLIENT_CONNECT\n---------------------------------------\nClient ID: ${parsedMessage.targetClientId}`,
				);

				//Log the session that just connected
				id = parsedMessage.targetClientId;

				//Log the client's public key
				publicKeys.set(id, parsedMessage.publicKey);

				if (!clients.has(id)) {
					clients.set(id, new Set());
				}

				clients.get(id).add(ws);

				//Generate a name, store it, and send it to the client
				if (!clientAndNames.has(id)) {
					const name = generateName();
					clientAndNames.set(id, name);

					await saveData();

					ws.send(
						JSON.stringify({
							signal: "CLIENT_NAME",
							name: clientAndNames.get(id),
						}),
					);
				}

				//Send a list of all previously connected clients and their online statuses
				const contacts = [];

				const contactsForClient = sessions.get(id) ?? [];
				for (const connectedClientId of contactsForClient) {
					contacts.push({
						id: connectedClientId,
						name: clientAndNames.get(connectedClientId),
						online: clients.has(connectedClientId),
					});

					if (clients.has(connectedClientId)) {
						// Existing online status update
						for (const client of clients.get(connectedClientId)) {
							client.send(
								JSON.stringify({
									signal: "CLIENT_STATUS_CHANGE",
									clientId: id,
									online: true,
								}),
							);
						}

						// Exchange public keys
						const myKey = publicKeys.get(id);
						const theirKey = publicKeys.get(connectedClientId);

						if (myKey) {
							for (const client of clients.get(
								connectedClientId,
							)) {
								client.send(
									JSON.stringify({
										signal: "PUBLIC_KEY",
										targetClientId: id,
										publicKey: myKey,
									}),
								);
							}
						}

						if (theirKey) {
							ws.send(
								JSON.stringify({
									signal: "PUBLIC_KEY",
									targetClientId: connectedClientId,
									publicKey: theirKey,
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
				console.log(
					`MESSAGE RECEIVED: REQUEST_PAIRING_CODE\n---------------------------------------`,
				);

				//Generate and send a pairing code
				let newPairingCode = generatePairingCode();
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
					console.log("Pairing code deleted");
				}, 60000);
				break;

			case "CHANGE_NAME":
				console.log(
					`MESSAGE RECEIVED: CHANGE_NAME\n---------------------------------------\nName: ${parsedMessage.name}`,
				);
				//Change the clients name to what they sent
				clientAndNames.set(id, parsedMessage.name);

				await saveData();

				const connectedClients = sessions.get(id);

				//Alert every connected client to the name change
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
				console.log(
					`MESSAGE RECEIVED: CONNECT_WITH_CLIENT\n---------------------------------------\nPairing code: ${parsedMessage.pairingCode}`,
				);
				//Check if valid pairing code
				if (pairingCodes.has(parsedMessage.pairingCode)) {
					console.log("Connected");

					//Get id of the target to pair with
					const targetId = pairingCodes.get(
						parsedMessage.pairingCode,
					);

					//Can't connect to yourself
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
					await saveData();

					//Send connection info to every client instance involved
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

					//Exchange public keys
					const myKey = publicKeys.get(id);
					const targetKey = publicKeys.get(targetId);

					if (myKey && clients.has(targetId)) {
						for (const client of clients.get(targetId)) {
							console.log("Sending public key");
							client.send(
								JSON.stringify({
									signal: "PUBLIC_KEY",
									targetClientId: id,
									publicKey: myKey,
								}),
							);
						}
					}

					if (targetKey) {
						ws.send(
							JSON.stringify({
								signal: "PUBLIC_KEY",
								targetClientId: targetId,
								publicKey: targetKey,
							}),
						);
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
			case "REMOVE_CLIENT":
				console.log(
					`MESSAGE RECEIVED: REMOVE_CLIENT\n---------------------------------------\nClient ID: ${parsedMessage.clientId}`,
				);

				sessions.get(id)?.delete(parsedMessage.clientId);
				sessions.get(parsedMessage.clientId)?.delete(id);

				await saveData();

				if (clients.has(parsedMessage.clientId)) {
					for (const client of clients.get(parsedMessage.clientId)) {
						client.send(
							JSON.stringify({
								signal: "CLIENT_REMOVED",
								clientId: id,
							}),
						);
					}
				}

				break;
			case "FILE_META":
				console.log(
					`MESSAGE RECEIVED: FILE_META\n---------------------------------------\nTarget client ID: ${parsedMessage.targetClientId}\nFilename: ${parsedMessage.name}\nFile type: ${parsedMessage.type}\nTimestamp: ${parsedMessage.timestamp}\nFile size: ${parsedMessage.size}\nMessage ID: ${parsedMessage.messageId}`,
				);

				if (busyClients.has(parsedMessage.targetClientId)) {
					ws.send(
						JSON.stringify({
							signal: "FILE_FAILED",
							messageId: parsedMessage.messageId,
						}),
					);
					break;
				}

				currentTargetClientId = parsedMessage.targetClientId;
				busyClients.add(parsedMessage.targetClientId);

				currentMessageId = parsedMessage.messageId;

				//Check if the clients are allowed to transfer files (connected)
				for (const [key, value] of sessions) {
					if (key == id) {
						for (const x of value) {
							if (x == parsedMessage.targetClientId) {
								//Send the file meta to the main instance of the target client
								canTransfer = true;

								transferTargets = [...clients.get(x)];
								if (!transferTargets) break;

								transferTargets[0].send(
									JSON.stringify({
										signal: "FILE_META",
										iv: parsedMessage.iv,
										client: {
											id,
											name: clientAndNames.get(id),
										},
										name: parsedMessage.name,
										type: parsedMessage.type,
										size: parsedMessage.size,
										messageId: parsedMessage.messageId,
									}),
								);
							}
						}
					}
				}

				break;
			case "FILE_END":
				console.log(
					`MESSAGE RECEIVED: FILE_END\n---------------------------------------\nMessage ID: ${parsedMessage.messageId}`,
				);
				//Send the file end to the main instance of the target client
				if (!transferTargets) break;

				if (currentTargetClientId) {
					busyClients.delete(currentTargetClientId);
					currentTargetClientId = null;
				}

				transferTargets[0].send(
					JSON.stringify({
						signal: "FILE_END",
						messageId: parsedMessage.messageId,
					}),
				);

				ws.send(
					JSON.stringify({
						signal: "FILE_SENT",
						messageId: parsedMessage.messageId,
					}),
				);

				canTransfer = false;
				transferTargets = null;
				currentMessageId = null;
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
			//Delete this instance of the client
			sockets.delete(ws);

			//If no other instances are open, alert every connection that this client is offline
			if (sockets.size == 0) {
				if (canTransfer && transferTargets && currentMessageId) {
					console.log("message failed");
					transferTargets[0].send(
						JSON.stringify({
							signal: "FILE_FAILED",
							messageId: currentMessageId,
						}),
					);

					if (currentTargetClientId) {
						busyClients.delete(currentTargetClientId);
						currentTargetClientId = null;
					}

					canTransfer = false;
					transferTargets = null;
					currentMessageId = null;
				}

				const contactsForClient = sessions.get(id) ?? new Set();

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
