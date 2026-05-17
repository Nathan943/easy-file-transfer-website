import { clearInterval } from "node:timers";
import WebSocket, { WebSocketServer } from "ws";
import crypto from "node:crypto";
import { link } from "node:fs";

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

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
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
      signal: 2,
      content: name,
    }),
  );

  //Vars for file transfer
  var canTransfer = false;
  var transferTarget = null;

  console.log("Total clients: ", clients.size);

  /* 
    When client sends a message
    */
  ws.on("message", (msg) => {
    if (!isJson(msg)) {
      if (canTransfer) {
        transferTarget.send(msg);
        return;
      }
    }

    const parsedMessage = JSON.parse(msg.toString());

    /*
        Decide what to do with it

        Signals:
            0 - Generate pairing code for the client
            1 - Connect with another client through pairing code
            2 - 
            3 - Metadata for a file transfer
            4 - End signal for a file transfer
        */
    switch (parsedMessage.signal) {
      case 0:
        let newPairingCode = generatePairingCode();

        //Send code and log it
        ws.send(
          JSON.stringify({
            signal: 0,
            content: newPairingCode,
          }),
        );
        pairingCodes.set(newPairingCode, id);

        //Delete pairing code after 60 seconds
        setTimeout(() => {
          pairingCodes.delete(newPairingCode);
        }, 60000);
        break;
      case 1:
        //Check if valid pairing code
        if (pairingCodes.has(parsedMessage.content)) {
          console.log("Connected!");

          //Get id of the target to pair with
          const targetId = pairingCodes.get(parsedMessage.content);

          //Link two clients by id
          linkSession(id, targetId);

          ws.send(
            JSON.stringify({
              signal: 1,
              content: {
                client_id: targetId,
                client_name: clientAndNames.get(targetId),
              },
            }),
          );
          clients.get(targetId).send(
            JSON.stringify({
              signal: 1,
              content: {
                client_id: id,
                client_name: clientAndNames.get(id),
              },
            }),
          );
        } else {
          //Pairing code expired or does not exist
          console.log("Unsuccessful connection");
          ws.send(
            JSON.stringify({
              signal: 1,
              content: null,
            }),
          );
        }
        break;
      case 3:
        if (canTransfer) {
          break;
        }

        //Check if the clients are allowed to transfer files
        for (const [key, value] of sessions) {
          if (key == id) {
            for (const x of value) {
              if (x == parsedMessage.target) {
                canTransfer = true;
                transferTarget = clients.get(x);

                transferTarget.send(
                  JSON.stringify({
                    signal: 3,
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
      case 4:
        transferTarget.send(
          JSON.stringify({
            signal: 4,
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
