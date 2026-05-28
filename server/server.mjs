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
	//Generate client id and store it
	const id = crypto.randomUUID();
	clients.set(id, ws);

	//Generate name and store it
	const name = generateName();
	clientAndNames.set(id, name);
	ws.send(
		JSON.stringify({
			signal: "CLIENT_NAME",
			name: name,
		}),
	);

	//Vars for file transfer
	var canTransfer = false;
	var transferTarget = null;

	console.log("Total clients: ", clients.size);

	/* 
    When client sends a message
    */
	ws.on("message", (msg, isBinary) => {
		if (isBinary) {
			if (canTransfer && transferTarget) {
				transferTarget.send(msg);
			}
			return;
		}

		const parsedMessage = JSON.parse(msg.toString());

		/*
        Decide what to do with it
        */
		switch (parsedMessage.signal) {
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
					clients.get(targetId).send(
						JSON.stringify({
							signal: "CONNECTED_CLIENT_INFO",
							clientId: id,
							clientName: clientAndNames.get(id),
						}),
					);
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
				if (canTransfer) {
					break;
				}

				//Check if the clients are allowed to transfer files
				for (const [key, value] of sessions) {
					if (key == id) {
						for (const x of value) {
							if (x == parsedMessage.targetClientId) {
								canTransfer = true;
								transferTarget = clients.get(x);

								if (!transferTarget) break;

								transferTarget.send(
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

				break;
			case "FILE_END":
				if (!transferTarget) break;

				transferTarget.send(
					JSON.stringify({
						signal: "FILE_END",
					}),
				);

				canTransfer = false;
				transferTarget = null;
				break;
		}
	});

	/* 
    When client is disconnected
    */

	ws.on("close", function close() {
		console.log("close received");
		clients.delete(id);
	});
});
