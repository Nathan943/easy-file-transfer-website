class FileStorageHandler {
	private request: IDBOpenDBRequest | null = null;
	private db: IDBDatabase | null = null;

	async connect(): Promise<void> {
		if (this.db) return;

		return new Promise((resolve, reject) => {
			this.request = window.indexedDB.open("FileStorage", 3);

			this.request.onerror = () => reject(this.request?.error);

			this.request.onupgradeneeded = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;

				if (!this.db.objectStoreNames.contains("messages")) {
					this.db.createObjectStore("messages", {
						keyPath: "id",
					});
				}
			};

			this.request.onsuccess = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				console.log("Database opened");

				resolve();
			};
		});
	}

	async addFile(fileId: string, file: File): Promise<void> {
		if (!this.db) {
			throw new Error("Database not found");
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction("messages", "readwrite");
			const store = transaction.objectStore("messages");

			const request = store.put({ id: fileId, file: file });

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getFile(fileId: string): Promise<File | null> {
		if (!this.db) {
			console.error("Database not found");
			return null;
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction("messages", "readonly");
			const store = transaction.objectStore("messages");

			const request = store.get(fileId);

			request.onsuccess = () => {
				resolve(request.result?.file ?? null);
			};

			request.onerror = () => {
				reject(request.error);
			};
		});
	}
}

export default new FileStorageHandler();
