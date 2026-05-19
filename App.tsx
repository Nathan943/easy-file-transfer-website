import React, { useState } from "react";
import Header from "./src/components/Header";
import Name from "./src/components/Name";
import Sidebar from "./src/components/Sidebar";
import MainContent from "./src/components/MainContent";
import { Message, Conversation, Client } from "./src/types/types";

const App = () => {
	//List of connected clients, stored as name and id
	const [clients] = useState<Client[]>([
		{ id: crypto.randomUUID(), name: "shte" },
		{ id: crypto.randomUUID(), name: "shte" },
		{ id: crypto.randomUUID(), name: "numa" },
	]);

	//Keep track of the client that is currently being viewed
	const [selectedClient, setSelectedClient] = useState<Client>({
		id: "",
		name: "",
	});
	const [showMenu, setShowMenu] = useState(false);

	//Hold all conversations, storing id and messages
	const [conversations, setConversations] = useState<Conversation[]>([]);

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
	const buildMessage = (file: File) => {
		const msg: Message = {
			id: crypto.randomUUID(),
			sender: "",
			filename: file.name,
			downloadUrl: URL.createObjectURL(file),
			timestamp: Date.now(),
		};

		return msg;
	};

	return (
		<div className="d-flex flex-column vh-100">
			<div className="d-flex flex-grow-1">
				<Sidebar
					clients={clients}
					onSelectClient={setSelectedClient}
					showMenu={showMenu}
					setShowMenu={setShowMenu}
				/>

				<MainContent
					showMenu={showMenu}
					onFileSelect={(file) => {
						const message = buildMessage(file);

						addMessage(selectedClient, message);
					}}
					messages={getMessages()}
				/>
			</div>
		</div>
	);
};

export default App;
