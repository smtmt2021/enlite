/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { unlinkSync, writeFileSync, readFileSync } from 'fs';
import { EnliteConfig } from '../src/interfaces';
import { getEnliteConfig, updateWsunCache } from '../src/enlite-config';

const config = {
  wsun: {
    adaptor: 'MOCK',
    id: {
      id: '1234567890ABCDEF1234567890ABCDEF',
      password: '1234567890AB'
    },
    config: {
      device: '/dev/tty.test'
    }
  }
} as EnliteConfig;
const cache = {
  channel: 0x23,
  panId: 0xfedc,
  addr: '0123456789ABCDEF'
};
const descriptor = {
  channel: 0x23,
  page: 0,
  panId: 0xfedc,
  addr: '0123456789ABCDEF',
  LQI: 0,
  pairId: 'CCDDEEFF'
};
const configPath = './.enlite.json';

beforeAll(() => {
  try {
    unlinkSync(configPath);
  } catch {}
  writeFileSync(configPath, JSON.stringify(config));
});

test('enlite config', async () => {
  expect(getEnliteConfig()).toEqual(config);
  await expect(updateWsunCache(descriptor)).resolves.toBeUndefined();
  config.wsun.cache = cache;
  expect(JSON.parse(readFileSync(configPath, 'utf8'))).toEqual(config);
});
