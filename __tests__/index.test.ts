/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
jest.mock('@smtmt2021/wsun-adaptor');
import { unlinkSync, writeFileSync } from 'fs';
import { EnliteGetInstance } from '../src/';
import { EnliteConfig } from '../src/interfaces';
import { EnliteImpl } from '../src/enlite-impl';

const configFilePath = './.enlite.json';
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

test('failed to get an enlite', () => {
  try {
    unlinkSync(configFilePath);
  } catch {}
  expect(() => EnliteGetInstance()).toThrow();
});

test('get an enlite', () => {
  writeFileSync(configFilePath, JSON.stringify(config, null, '  '));
  const enlite = EnliteGetInstance();
  expect(enlite).toBeInstanceOf(EnliteImpl);
});
