export interface Message {
	id: string;
	sender: string;
	filename: string;
	downloadUrl: string;
	timestamp: number;
}

export interface Conversation {
	client: Client;
	messages: Message[];
}

export interface Client {
	id: string;
	name: string;
}
