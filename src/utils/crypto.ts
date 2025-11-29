import { createHash } from 'crypto';
import { config } from 'dotenv';
import generator from 'generate-password';

config();

export function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET);
}

export const generateRandomPassword = generator.generate({
  length: 16,
  numbers: true,
  symbols: true,
  uppercase: true,
  lowercase: true,
  strict: true
});
