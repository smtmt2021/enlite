/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import path from 'path';
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { EnliteConfig } from './interfaces';
import { WsunCache } from '@smtmt2021/wsun-adaptor';
const configFilePath = path.resolve(process.cwd(), '.enlite.json');
let config: EnliteConfig;

export function getEnliteConfig(): EnliteConfig {
  if (!config) {
    config = JSON.parse(readFileSync(configFilePath, 'utf8')) as EnliteConfig;
  }
  return config;
}

export async function updateWsunCache(cache: WsunCache): Promise<void> {
  if (config) {
    const { channel, panId, addr } = cache;
    config.wsun.cache = { channel, panId, addr };
    await writeFile(configFilePath, JSON.stringify(config, null, '  '));
  }
}
