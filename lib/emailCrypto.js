import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes
} from "crypto";

// At-rest protection for commenter emails (server-side only).
//
// - emailEncrypted: AES-256-GCM, random 12-byte IV per encryption, stored as
//   "v1:<iv b64>:<authTag b64>:<ciphertext b64>". Only decrypted when an email
//   is actually being sent.
// - emailHash: HMAC-SHA-256 (hex) of the normalized email with a SEPARATE key.
//   Deterministic, so it is what every comparison (dedupe, "is this the
//   author?", unsubscribe) uses.
//
// Keys: EMAIL_ENCRYPTION_KEY and EMAIL_HASH_KEY, each 32 random bytes encoded
// as base64. Generate with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
// Losing EMAIL_ENCRYPTION_KEY makes every stored email unreadable forever;
// changing EMAIL_HASH_KEY breaks dedupe/unsubscribe matching for old docs.
//
// This file must stay free of "@/..." imports: the migration script in
// scripts/ imports it directly with plain Node.

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class EmailCryptoConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailCryptoConfigError";
  }
}

function loadKey(name) {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    throw new EmailCryptoConfigError(
      `${name} is not set. Commenter emails cannot be encrypted/hashed. ` +
        `Set ${name} to 32 random bytes encoded as base64.`
    );
  }
  const key = Buffer.from(raw.trim(), "base64");
  if (key.length !== 32) {
    throw new EmailCryptoConfigError(
      `${name} must be 32 bytes encoded as base64 (got ${key.length} bytes after decoding).`
    );
  }
  return key;
}

/** Throws EmailCryptoConfigError if either key is missing or invalid. */
export function assertEmailCryptoConfigured() {
  loadKey("EMAIL_ENCRYPTION_KEY");
  loadKey("EMAIL_HASH_KEY");
}

function canonical(email) {
  return String(email).trim().toLowerCase();
}

/** Deterministic HMAC-SHA-256 (hex) of the normalized email. */
export function hashEmail(email) {
  return createHmac("sha256", loadKey("EMAIL_HASH_KEY"))
    .update(canonical(email), "utf8")
    .digest("hex");
}

/** AES-256-GCM encryption of the normalized email -> "v1:iv:tag:ciphertext". */
export function encryptEmail(email) {
  const key = loadKey("EMAIL_ENCRYPTION_KEY");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(canonical(email), "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64")
  ].join(":");
}

/** Decrypts a value produced by encryptEmail. Throws if it was tampered with. */
export function decryptEmail(payload) {
  const parts = typeof payload === "string" ? payload.split(":") : [];
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Unsupported encrypted email format.");
  }
  const key = loadKey("EMAIL_ENCRYPTION_KEY");
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Malformed encrypted email.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, iv, {
    authTagLength: TAG_BYTES
  });
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString("utf8");
}

/**
 * The hash of a stored commentEmail doc. New docs carry emailHash; legacy docs
 * (plaintext `email`, not yet migrated) get it computed on the fly.
 */
export function storedEmailHash(doc) {
  if (doc?.emailHash) return doc.emailHash;
  if (doc?.email) return hashEmail(doc.email);
  return null;
}

/** The address to send to for a stored commentEmail doc (decrypts if needed). */
export function storedEmailAddress(doc) {
  if (doc?.emailEncrypted) return decryptEmail(doc.emailEncrypted);
  if (doc?.email) return canonical(doc.email);
  return null;
}
