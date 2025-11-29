import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ACCOUNTS_ENCRYPTION_KEY || '';
const IV_LENGTH = 16;

function getKeyBuffer(): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      'Invalid ACCOUNTS_ENCRYPTION_KEY: must be a 64-character hex string (32 bytes for aes-256-cbc).'
    );
  }
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

export function encryptPassword(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptPassword(encrypted: string): string {
  const [ivHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = getKeyBuffer();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
