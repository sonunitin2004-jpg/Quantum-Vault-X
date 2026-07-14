/**
 * Futuristic Client-Side Database Engine (Zero-Configuration MVP)
 * Combines localStorage (for quick auth sessions) and IndexedDB (for large encrypted file blobs).
 */

const DB_NAME = "QuantumVaultDB";
const DB_VERSION = 1;

export interface LocalUser {
  id: string;
  email: string;
}

export interface LocalNeuralPassword {
  user_id: string;
  password_hash: string;
  updated_at: string;
}

export interface LocalBiometricData {
  user_id: string;
  biometric_hash: string;
  biometric_type: string;
  updated_at: string;
}

export interface LocalVaultFile {
  id: string;
  user_id: string;
  file_name: string;
  file_type: "image" | "video" | "document";
  storage_path: string;
  created_at: string;
}

/**
 * Opens and initializes the IndexedDB database.
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("neural_passwords")) {
        db.createObjectStore("neural_passwords", { keyPath: "user_id" });
      }
      if (!db.objectStoreNames.contains("biometric_data")) {
        db.createObjectStore("biometric_data", { keyPath: "user_id" });
      }
      if (!db.objectStoreNames.contains("vault_files")) {
        db.createObjectStore("vault_files", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("vault_blobs")) {
        db.createObjectStore("vault_blobs", { keyPath: "storage_path" });
      }
    };
  });
}

/**
 * Execute an operation on a specific object store.
 */
async function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<any> | void
): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    
    let request: IDBRequest<any> | void;
    try {
      request = callback(store);
    } catch (err) {
      tx.abort();
      return reject(err);
    }

    tx.oncomplete = () => {
      if (request && "result" in request) {
        resolve(request.result);
      } else {
        resolve(undefined as any);
      }
    };

    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error("Transaction aborted"));
  });
}

export const localDb = {
  /**
   * Registers a new user.
   */
  async signUp(email: string, password: string): Promise<LocalUser> {
    // Check if user already exists
    const users = await this.getAllUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error("User already exists");
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash: btoa(password), // Simple client-side credential obfuscation
      created_at: new Date().toISOString(),
    };

    await runTx("users", "readwrite", (store) => store.put(newUser));
    
    const sessionUser = { id: newUser.id, email: newUser.email };
    localStorage.setItem("qx_session", JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Authenticates a user.
   */
  async signIn(email: string, password: string): Promise<LocalUser> {
    const users = await this.getAllUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.passwordHash === btoa(password)
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const sessionUser = { id: user.id, email: user.email };
    localStorage.setItem("qx_session", JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Logs out the user.
   */
  async signOut(): Promise<void> {
    localStorage.removeItem("qx_session");
  },

  /**
   * Retrieves the current session user.
   */
  getSessionUser(): LocalUser | null {
    const session = localStorage.getItem("qx_session");
    return session ? JSON.parse(session) : null;
  },

  /**
   * Helper to retrieve all users.
   */
  async getAllUsers(): Promise<any[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("users", "readonly");
      const store = tx.objectStore("users");
      const request = store.getAll();
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Retrieves the neural password hash for a user.
   */
  async getNeuralPassword(userId: string): Promise<LocalNeuralPassword | null> {
    const record = await runTx<LocalNeuralPassword | undefined>(
      "neural_passwords",
      "readonly",
      (store) => store.get(userId)
    );
    return record || null;
  },

  /**
   * Saves/Updates the neural password hash for a user.
   */
  async saveNeuralPassword(userId: string, passwordHash: string): Promise<void> {
    const record: LocalNeuralPassword = {
      user_id: userId,
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    };
    await runTx("neural_passwords", "readwrite", (store) => store.put(record));
  },

  /**
   * Retrieves biometric configuration status for a user.
   */
  async getBiometricStatus(userId: string): Promise<{ enabled: boolean } | null> {
    const record = await runTx<any | undefined>(
      "biometric_data",
      "readonly",
      (store) => store.get(userId)
    );
    return record ? { enabled: record.enabled } : null;
  },

  /**
   * Saves/Updates biometric configuration status for a user.
   */
  async saveBiometricStatus(userId: string, enabled: boolean): Promise<void> {
    const record = {
      user_id: userId,
      enabled,
      updated_at: new Date().toISOString(),
    };
    await runTx("biometric_data", "readwrite", (store) => store.put(record));
  },

  /**
   * Retrieves all file metadata for a specific user.
   */
  async getFiles(userId: string): Promise<LocalVaultFile[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("vault_files", "readonly");
      const store = tx.objectStore("vault_files");
      const request = store.getAll();
      tx.oncomplete = () => {
        const allFiles: LocalVaultFile[] = request.result || [];
        resolve(allFiles.filter((f) => f.user_id === userId));
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Saves file metadata and the encrypted file blob to IndexedDB.
   */
  async saveFile(
    userId: string,
    fileName: string,
    fileType: "image" | "video" | "document",
    storagePath: string,
    encryptedBlob: Blob
  ): Promise<LocalVaultFile> {
    const newFile: LocalVaultFile = {
      id: crypto.randomUUID(),
      user_id: userId,
      file_name: fileName,
      file_type: fileType,
      storage_path: storagePath,
      created_at: new Date().toISOString(),
    };

    // Save metadata
    await runTx("vault_files", "readwrite", (store) => store.put(newFile));

    // Save actual encrypted blob
    await runTx("vault_blobs", "readwrite", (store) =>
      store.put({ storage_path: storagePath, blob: encryptedBlob })
    );

    return newFile;
  },

  /**
   * Downloads the encrypted blob from IndexedDB.
   */
  async getFileBlob(storagePath: string): Promise<Blob> {
    const record = await runTx<{ storage_path: string; blob: Blob } | undefined>(
      "vault_blobs",
      "readonly",
      (store) => store.get(storagePath)
    );
    if (!record || !record.blob) {
      throw new Error(`File payload not found for path: ${storagePath}`);
    }
    return record.blob;
  },

  /**
   * Deletes file metadata and its blob payload.
   */
  async deleteFile(fileId: string, storagePath: string): Promise<void> {
    // Delete metadata
    await runTx("vault_files", "readwrite", (store) => store.delete(fileId));
    // Delete blob
    await runTx("vault_blobs", "readwrite", (store) => store.delete(storagePath));
  },
};
