import { readFileSync } from 'node:fs';
import { ConfigService } from '@nestjs/config';

export function readSecret(
  config: ConfigService,
  key: string,
): string | undefined {
  const file = config.get<string>(`${key}_FILE`);
  return file ? readFileSync(file, 'utf8').trim() : config.get<string>(key);
}
