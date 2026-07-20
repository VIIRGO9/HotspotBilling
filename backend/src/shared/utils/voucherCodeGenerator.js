// backend/src/shared/utils/voucherCodeGenerator.js
import crypto from "crypto";

// Character set excludes visually ambiguous characters to reduce transcription errors.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12;
const GROUP_SIZE = 4;

/**
 * Generates a cryptographically secure random voucher code.
 * Format: XXXX-XXXX-XXXX
 * @returns {string} The formatted voucher code.
 */
export const generateVoucherCode = () => {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }

  // Format as XXXX-XXXX-XXXX
  return code.match(new RegExp(`.{1,${GROUP_SIZE}}`, "g")).join("-");
};
