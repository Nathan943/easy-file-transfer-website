import { useEffect, useRef, useState } from "react";
import Header from "./src/components/Header";
import Name from "./src/components/Name";
import Sidebar from "./src/components/Sidebar";
import MainContent from "./src/components/MainContent";
import { Message, Conversation, Client, IncomingFile } from "./src/types/types";
import socketHandler from "./src/handlers/SocketHandler";
import fileStorageHandler from "./src/handlers/FileStorageHandler";

const App = () => {
	//List of connected clients, stored as name and id
	const [clients, setClients] = useState<Client[]>(() => {
		const saved = localStorage.getItem("contacts");

		if (!saved) return [];

		try {
			return JSON.parse(saved);
		} catch {
			return [];
		}
	});

	//Keep track of the client that is currently being viewed
	const [selectedClient, setSelectedClient] = useState<Client>({
		id: "",
		name: "",
		online: false,
	});

	//For the MainContent component to decide whether to show the pairing menu or not
	const [showMenu, setShowMenu] = useState(false);

	//Hold all conversations, storing id and messages
	const [conversations, setConversations] = useState<Conversation[]>(() => {
		//Load in converstaions from local storage if it has them
		const saved = localStorage.getItem("conversations");

		if (!saved) return [];

		try {
			return JSON.parse(saved);
		} catch {
			return [];
		}
	});
	let isRemoteUpdate = useRef(false);

	//Pairing code from websocket server
	const [pairingCode, setPairingCode] = useState(0);
	const [name, setName] = useState(localStorage.getItem("displayName") ?? "");

	//Add a new message to a conversation, creating one if there is not already
	const addMessage = (client: Client, message: Message) => {
		setConversations((prev) => {
			//Check if a conversation for the client already exists
			const conversationExists = prev.some(
				(conversation) => conversation.client.id == client.id,
			);

			//If no conversation exists (new client), create a new one
			if (!conversationExists) {
				return [...prev, { client, messages: [message] }];
			}

			return prev.map((conversation) => {
				//Add message to conversation and return that concatenated message array
				if (conversation.client.id == client.id) {
					return {
						client: conversation.client,
						messages: [...conversation.messages, message],
					};
				}

				//If the client isnt there, return the original array
				return conversation;
			});
		});
	};

	//Get all messages with the selected client
	const getMessages = () => {
		//Find the selected client's conversation
		const conversation = conversations.find(
			(conversation) => conversation.client.id == selectedClient.id,
		);

		return conversation ? conversation.messages : [];
	};

	//Build message contents to be displayed
	const buildMessage = (file: File, client?: Client, timestamp?: number) => {
		const msg: Message = {
			id: crypto.randomUUID(),
			sender: client,
			filename: file.name,
			downloadUrl: URL.createObjectURL(file),
			timestamp: timestamp
				? new Date(timestamp).toLocaleString()
				: undefined,
		};

		return msg;
	};

	const editMessage = (
		id: string,
		sender?: Client,
		filename?: string,
		downloadUrl?: string,
		timestamp?: number,
	) => {
		setConversations((prev) =>
			prev.map((conversation) => ({
				...conversation,
				messages: conversation.messages.map((message) => {
					if (message.id != id) return message;

					return {
						...message,
						...(sender != undefined && { sender }),
						...(filename != undefined && { filename }),
						...(downloadUrl != undefined && { downloadUrl }),
						...(timestamp != undefined && {
							timestamp: new Date(timestamp).toLocaleString(),
						}),
					};
				}),
			})),
		);
	};

	//Triggered when user wants to change their name
	const editName = (name: string) => {
		socketHandler.editName(name);
		setName(name);
	};

	/*
	Give each message a download link for its saved file, if the file exists
	Triggers when the client first connects and whenever a new message is saved to the database
	*/
	const rebuildConversations = async (conversations: Conversation[]) => {
		//Loop through every message in every conversation
		return Promise.all(
			conversations.map(async (conversation) => ({
				...conversation,
				messages: await Promise.all(
					conversation.messages.map(async (message) => {
						//Check if there is a saved file in the database
						const file = await fileStorageHandler.getFile(
							message.id,
						);

						if (!file) return message;

						//Create a download link for the file
						return {
							...message,
							downloadUrl: URL.createObjectURL(file),
						};
					}),
				),
			})),
		);
	};

	//Update local storage when a new contact is added
	useEffect(() => {
		localStorage.setItem("contacts", JSON.stringify(clients));

		for (const client of clients) {
			if (client.id == selectedClient.id) {
				setSelectedClient(client);
			}
		}
	}, [clients]);

	//Update local storage when a new message or conversation is added
	useEffect(() => {
		//Ensures the update doesn't infinitely loop
		if (isRemoteUpdate.current) {
			isRemoteUpdate.current = false;
			return;
		}

		const modifiedConversations = conversations.map((conversation) => ({
			...conversation,
			messages: conversation.messages.map((message) => ({
				id: message.id,
				sender: message.sender,
				filename: message.filename,
				timestamp: message.timestamp,
			})),
		}));

		localStorage.setItem(
			"conversations",
			JSON.stringify(modifiedConversations),
		);
	}, [conversations]);

	//Update local storage when name is changed
	useEffect(() => {
		localStorage.setItem("displayName", name);
	}, [name]);

	//Update document title when selectedClient is changed
	useEffect(() => {
		document.title = selectedClient.name
			? `File sharing with: ${selectedClient.name}`
			: "File sharing";
	}, [selectedClient.name]);

	//On program start, initialize the databases and assign links for files if necessary
	useEffect(() => {
		const init = async () => {
			await fileStorageHandler.connect();

			const rebuilt = await rebuildConversations(conversations);
			setConversations(rebuilt);
		};

		init();
	}, []);

	//When local storage changes, do different things based on what changed
	useEffect(() => {
		const handleStorage = async (e: StorageEvent) => {
			//If displayName is edited, change the UI to reflect that
			if (e.key == "displayName") {
				setName(e.newValue ?? "");
			}

			//If conversations is edited, rebuild the file links again
			if (e.key == "conversations") {
				try {
					const stored = e.newValue ? JSON.parse(e.newValue) : [];

					const rebuilt = await rebuildConversations(stored);
					isRemoteUpdate.current = true;
					setConversations(rebuilt);
				} catch {
					setConversations([]);
				}
			}
		};

		window.addEventListener("storage", handleStorage);

		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, []);

	//This useEffect handles interfacing with the WebSocket (intializes on program start)
	useEffect(() => {
		//Generate a new id for this client if there isnt one saved in local storage
		const clientId =
			localStorage.getItem("clientId") ?? crypto.randomUUID();
		localStorage.setItem("clientId", clientId);

		//Initialize WS connection
		socketHandler.connect(String(clientId));

		/*
		These are a bunch of functions for changing UI based on incoming data from the server
		*/
		socketHandler.onPairCodeReceived((code: number) => {
			setPairingCode(code);
		});

		socketHandler.onNameReceived((name: string) => {
			setName(name);
		});

		socketHandler.onClientConnected((client: Client) => {
			setClients((prev) => {
				if (prev.some((c) => c.id == client.id)) {
					return prev;
				}

				return [...prev, client];
			});
		});

		socketHandler.onFileReceived(async (client: Client, file: File) => {
			const message = buildMessage(file, client, Date.now());

			console.log("file received");
			//Upload to database
			await fileStorageHandler.addFile(message.id, file);

			//Add file to the specified client
			addMessage(client, message);
		});

		socketHandler.onNameChanged((targetClientId: string, name: string) => {
			setClients((prev) =>
				prev.map((client) =>
					client.id == targetClientId ? { ...client, name } : client,
				),
			);
		});

		socketHandler.onContactsReceived((contacts: Client[]) => {
			setClients(contacts);
		});

		socketHandler.onClientOnlineStatusChange(
			//Change status of the specified client
			(targetClientId: string, online: boolean) => {
				setClients((prev) =>
					prev.map((client) =>
						client.id == targetClientId
							? { ...client, online }
							: client,
					),
				);
			},
		);

		socketHandler.onFileSent((messageId: string) => {
			editMessage(messageId, undefined, undefined, undefined, Date.now());
		});

		return () => {
			socketHandler.disconnect();
		};
	}, []);

	return (
		<div className="d-flex flex-column vh-100">
			<div className="d-flex flex-grow-1">
				<Sidebar
					clients={clients}
					name={name}
					editName={editName}
					onSelectClient={(client) => {
						setSelectedClient(client);
						setShowMenu(false);
					}}
					showMenu={showMenu}
					setShowMenu={setShowMenu}
				/>

				<MainContent
					showMenu={showMenu}
					pairingCode={pairingCode}
					generatePairingCode={socketHandler.getPairingCode}
					connectWithClient={socketHandler.connectWithClient}
					onFileSelect={async (file) => {
						const message = buildMessage(file);

						await fileStorageHandler.addFile(message.id, file);

						addMessage(selectedClient, message);
						socketHandler.send(file, selectedClient, message.id);
					}}
					messages={getMessages()}
					isOnline={selectedClient.online}
				/>
			</div>
		</div>
	);
};

export default App;
