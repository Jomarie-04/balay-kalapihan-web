import bcrypt from 'bcryptjs';

const resetCodes = new Map();
const RESET_CODE_TTL_MS = 10 * 60 * 1000;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function generateResetCode(length = 6) {
  const digits = '0123456789';
  return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
}

export async function storeResetCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const hashedCode = await bcrypt.hash(code, 8);
  resetCodes.set(normalizedEmail, {
    hashedCode,
    expiresAt: Date.now() + RESET_CODE_TTL_MS,
  });
  return { expiresAt: Date.now() + RESET_CODE_TTL_MS };
}

export async function verifyResetCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const record = resetCodes.get(normalizedEmail);

  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    resetCodes.delete(normalizedEmail);
    return false;
  }

  const isMatch = await bcrypt.compare(code, record.hashedCode);

  if (!isMatch) {
    return false;
  }

  resetCodes.delete(normalizedEmail);
  return true;
}

export function clearResetCode(email) {
  resetCodes.delete(normalizeEmail(email));
}
