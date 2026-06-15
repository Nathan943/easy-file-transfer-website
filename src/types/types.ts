export interface Message {
	id: string;
	sender?: Client;
	filename: string;
	downloadUrl?: string;
	timestamp?: string;
}

export interface Conversation {
	client: Client;
	messages: Message[];
}

export interface Client {
	id: string;
	name: string;
	online: boolean;
}

export interface IncomingFile {
	name: string;
	type: string;
	size: number;
	chunks: Blob[];
}

export interface OutgoingFileMeta {
	name: string;
	type: string;
	size: number;
}

export interface OutgoingFileData {
	data: Blob;
}

export interface QueuedUpload {
	file: File;
	targetClient: Client;
	messageId: string;
}
