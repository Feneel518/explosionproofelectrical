import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey() {
  const secret = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!secret || Buffer.from(secret, "base64").length !== 32) {
    throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY must contain a base64-encoded 32-byte key.");
  }
  return Buffer.from(secret, "base64");
}

export function encryptGmailSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function decryptGmailSecret(value: string) {
  const bytes = Buffer.from(value, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}

export function createGmailOAuthState(userId: string) {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  return {
    state,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
    cookie: encryptGmailSecret(JSON.stringify({ userId, state, verifier, expiresAt: Date.now() + 600_000 })),
  };
}

export function validateGmailOAuthState(cookie: string, state: string, userId: string): string {
  const saved = JSON.parse(decryptGmailSecret(cookie));
  if (saved.userId !== userId || saved.state !== state || saved.expiresAt < Date.now() || !saved.verifier) {
    throw new Error("Invalid Gmail authorization state.");
  }
  return saved.verifier;
}
