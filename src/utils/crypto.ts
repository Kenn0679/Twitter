import { createHash } from 'crypto';
import generator from 'generate-password';
import envConfig from './envConfig';

export function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export function hashPassword(password: string) {
  return sha256(password + envConfig.passwordSecret);
}

export const generateRandomPassword = generator.generate({
  length: 16,
  numbers: true,
  symbols: true,
  uppercase: true,
  lowercase: true,
  strict: true
});
