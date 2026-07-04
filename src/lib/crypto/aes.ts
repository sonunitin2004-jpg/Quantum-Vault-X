/**
 * AES-256-GCM File Encryption with Progress
 */

export async function encryptFileAES(
  file: File,
  key: CryptoKey,
  onProgress: (p: number) => void
): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await file.arrayBuffer();

  onProgress(30);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer
  );

  onProgress(80);

  // prepend IV
  const out = new Uint8Array(iv.byteLength + encrypted.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(encrypted), iv.byteLength);

  onProgress(100);

  return new Blob([out], { type: "application/octet-stream" });
}

/**
 * AES-256-GCM File Decryption with Progress
 */

export async function decryptFileAES(
  blob: Blob,
  key: CryptoKey,
  onProgress: (p: number) => void
): Promise<Blob> {
  const buffer = await blob.arrayBuffer();

  const iv = buffer.slice(0, 12);
  const data = buffer.slice(12);

  onProgress(30);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  onProgress(90);

  return new Blob([decrypted]);
}



