// backend/src/shared/utils/encryption.js
import crypto from "crypto";
import { env } from "../../config/env.js";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// Derive a 32-byte key from the existing JWT_SECRET
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(env.JWT_SECRET)
  .digest();

/**
 * Encrypts plaintext using AES-256-CBC.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} The encrypted string in format 'iv:encryptedData'.
 */
export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

/**
 * Decrypts ciphertext encrypted by the encrypt function.
 * @param {string} encryptedText - The encrypted string.
 * @returns {string} The decrypted plaintext.
 */
export const decrypt = (encryptedText) => {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) throw new Error("Invalid encrypted text format");

  const iv = Buffer.from(parts[0], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(parts[1], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
