import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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

	const [showMenu, setShowMenu] = useState(false);

	//Hold all conversations, storing id and messages
	const [conversations, setConversations] = useState<Conversation[]>(() => {
		const saved = localStorage.getItem("conversations");

		if (!saved) return [];

		try {
			return JSON.parse(saved);
		} catch {
			return [];
		}
	});
	let isRemoteUpdate = useRef(false);

	//Incoming values from websocket server
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

	//Get all messages for a conversation
	const getMessages = () => {
		const conversation = conversations.find(
			(conversation) => conversation.client.id == selectedClient.id,
		);

		return conversation ? conversation.messages : [];
	};

	//Build message contents to be displayed
	const buildMessage = (file: File, client?: Client) => {
		const msg: Message = {
			id: crypto.randomUUID(),
			sender: client,
			filename: file.name,
			downloadUrl: URL.createObjectURL(file),
			timestamp: new Date(Date.now()).toLocaleString(),
		};

		return msg;
	};

	const editName = (name: string) => {
		socketHandler.editName(name);
		setName(name);
	};

	const rebuildConversations = async (conversations: Conversation[]) => {
		return Promise.all(
			conversations.map(async (conversation) => ({
				...conversation,
				messages: await Promise.all(
					conversation.messages.map(async (message) => {
						const file = await fileStorageHandler.getFile(
							message.id,
						);

						if (!file) return message;

						return {
							...message,
							downloadUrl: URL.createObjectURL(file),
						};
					}),
				),
			})),
		);
	};

	useEffect(() => {
		//Save client list when it updates
		localStorage.setItem("contacts", JSON.stringify(clients));
		for (const client of clients) {
			if (client.id == selectedClient.id) {
				setSelectedClient(client);
			}
		}
	}, [clients]);

	useEffect(() => {
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

	useEffect(() => {
		localStorage.setItem("displayName", name);
	}, [name]);

	useEffect(() => {
		document.title = selectedClient
			? `File sharing with: ${selectedClient.name}`
			: "File sharing";
	}, [selectedClient]);

	useEffect(() => {
		const init = async () => {
			await fileStorageHandler.connect();

			const rebuilt = await rebuildConversations(conversations);
			setConversations(rebuilt);
		};

		init();
	}, []);

	useEffect(() => {
		const handleStorage = async (e: StorageEvent) => {
			if (e.key == "displayName") {
				setName(e.newValue ?? "");
			}

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

	useEffect(() => {
		//Generate a new id for this client if there isnt one already
		const clientId =
			localStorage.getItem("clientId") ?? crypto.randomUUID();
		localStorage.setItem("clientId", clientId);

		socketHandler.connect(String(clientId));

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
			const message = buildMessage(file, client);

			console.log("file received");
			await fileStorageHandler.addFile(message.id, file);

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
						socketHandler.send(file, selectedClient);
					}}
					messages={getMessages()}
					isOnline={selectedClient.online}
				/>
			</div>
		</div>
	);
};

export default App;
