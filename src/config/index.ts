import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function parseCorsOrigins(value: string | undefined): (string | RegExp)[] {
  const defaults = ['http://localhost:3000', 'chrome-extension://*'];
  const parts = (value ?? defaults.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.map((origin) => {
    if (origin === 'chrome-extension://*') {
      return /^chrome-extension:\/\//;
    }
    return origin;
  });
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
} as const;
