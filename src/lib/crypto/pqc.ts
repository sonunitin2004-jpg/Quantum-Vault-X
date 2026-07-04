import { MlKem768 } from "crystals-kyber-js";
import { encryptFileAES, decryptFileAES } from "./aes";

/**
 * Derives a Post-Quantum Crystals-Kyber (ML-KEM-768) key pair
 * deterministically from the user's neural password.
 */
export async function deriveKyberKeyPair(
  neuralPassword: string
): Promise<[Uint8Array, Uint8Array]> {
  const enc = new TextEncoder();
  
  // Use SHA-512 to hash the neural password into a secure 64-byte seed
  const seedBuffer = await crypto.subtle.digest(
    "SHA-512",
    enc.encode(neuralPassword)
  );
  const seed = new Uint8Array(seedBuffer);

  const recipient = new MlKem768();
  return await recipient.deriveKeyPair(seed); // Returns [pkR, skR]
}

/**
 * Encrypts a file using a hybrid Post-Quantum scheme:
 * 1. Encapsulate a shared secret key (ss) with ML-KEM-768 public key (pk).
 * 2. Encrypt the file payload with AES-256-GCM using the shared secret.
 * 3. Prepend the 1088-byte capsule (ct) to the encrypted payload.
 */
export async function encryptQuantumFile(
  file: File,
  pk: Uint8Array,
  onProgress: (p: number) => void
): Promise<Blob> {
  const sender = new MlKem768();
  
  // 1. Encapsulate shared secret (ss) and get ciphertext capsule (ct)
  const [ct, ss] = await sender.encap(pk);

  // 2. Import shared secret as an AES-GCM CryptoKey (32 bytes = 256 bits)
  const aesKey = await crypto.subtle.importKey(
    "raw",
    ss,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );

  // 3. Encrypt file using AES-256-GCM (this prepends the 12-byte IV)
  const aesEncryptedBlob = await encryptFileAES(file, aesKey, onProgress);
  const aesBuffer = await aesEncryptedBlob.arrayBuffer();

  // 4. Prepend the 1088-byte Kyber capsule to the output
  const output = new Uint8Array(ct.byteLength + aesBuffer.byteLength);
  output.set(ct, 0);
  output.set(new Uint8Array(aesBuffer), ct.byteLength);

  return new Blob([output], { type: "application/octet-stream" });
}

/**
 * Decrypts a file using the hybrid Post-Quantum scheme:
 * 1. Extract the 1088-byte Kyber capsule (ct) from the front of the blob.
 * 2. Decapsulate the capsule using the ML-KEM-768 private key (sk) to recover the shared secret.
 * 3. Decrypt the remaining payload with AES-256-GCM using the recovered secret.
 */
export async function decryptQuantumFile(
  blob: Blob,
  sk: Uint8Array,
  onProgress: (p: number) => void
): Promise<Blob> {
  const buffer = await blob.arrayBuffer();

  // ML-KEM-768 ciphertext (ct) is exactly 1088 bytes
  if (buffer.byteLength < 1088 + 12) {
    throw new Error("Encrypted payload is malformed or too short");
  }

  const ct = new Uint8Array(buffer.slice(0, 1088));
  const aesDataBuffer = buffer.slice(1088);

  const recipient = new MlKem768();
  
  // 1. Recover the shared secret (ss) using private key (sk)
  const ss = await recipient.decap(ct, sk);

  // 2. Import recovered secret as AES-GCM CryptoKey
  const aesKey = await crypto.subtle.importKey(
    "raw",
    ss,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );

  // 3. Decrypt the remaining payload (AES part handles the 12-byte IV)
  const aesBlob = new Blob([aesDataBuffer]);
  return await decryptFileAES(aesBlob, aesKey, onProgress);
}
