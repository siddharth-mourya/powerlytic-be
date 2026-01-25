import crypto from 'crypto';

export function calculateConfigHash(config: unknown): string {
  const cfgMin = JSON.stringify(config); // MUST be minified
  return crypto.createHash('sha256').update(cfgMin, 'utf8').digest('hex');
}
