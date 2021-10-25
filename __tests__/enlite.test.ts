/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
jest.mock('@smtmt2021/wsun-adaptor');
import { writeFileSync } from 'fs';
import { Enlite } from '../src/enlite';
import { WsunGetAdaptor } from '@smtmt2021/wsun-adaptor';
import { EnliteImpl } from '../src/enlite-impl';
import { EnliteConfig, SendToRemote } from '../src/interfaces';
import { WsunAdaptorTest, SocketTest } from '../__mocks__/@smtmt2021/wsun-adaptor';
import { Device } from '../src/device';
import { Property } from '../src/property';
import { Frame } from '../src/frame';
import { CLASS } from '../src';
import { ESV } from '../src/esv';
import { EPC } from '../src/epc';
import { PORT_ENLITE } from '../src/definitions';

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
const pandesc = {
  channel: 0x23,
  page: 1,
  panId: 0xfedc,
  addr: '0123456789ABCDEF',
  LQI: 2,
  pairId: 'CCDDEEFF'
};

class DeviceTest extends Device {
  constructor(
    protected controller: SendToRemote,
    public readonly address: string,
    deviceClass: CLASS,
    instanceCode = 1
  ) {
    super(controller, address, deviceClass, instanceCode);
  }
}

let enlite: Enlite;

beforeAll(async () => {
  writeFileSync(configFilePath, JSON.stringify(config, null, '  '));
  enlite = EnliteImpl.getInstance();
});

test('opening end up an error', async () => {
  await expect(enlite.open()).resolves.toBeFalsy();
});

test('opened & closed successfuly', async () => {
  const adaptor = WsunGetAdaptor(config.wsun.adaptor) as WsunAdaptorTest;
  adaptor.descriptor = pandesc;
  await expect(enlite.open()).resolves.toBeTruthy();
  expect((WsunGetAdaptor(config.wsun.adaptor) as WsunAdaptorTest).socket).toBeInstanceOf(SocketTest);
  await expect(enlite.close()).resolves.toBeUndefined();
});

test('recive a message', async () => {
  const property = new Property(EPC.INSTANCE_LIST_NOTIFICATION, Buffer.from('01028801', 'hex'));
  const frame = Frame.create({
    tid: 1,
    seoj: CLASS.NODE_PROFILE * 0x100 + 1,
    deoj: CLASS.NODE_PROFILE * 0x100 + 1,
    esv: ESV.INF,
    properties: [property]
  });
  const rinfo = {
    address: 'fe80:0000:0000:0000:0000:0000:0001:0001',
    family: 'ipv6',
    port: PORT_ENLITE,
    size: frame.buffer.length
  };

  const adaptor = WsunGetAdaptor(config.wsun.adaptor) as WsunAdaptorTest;
  adaptor.descriptor = pandesc;
  await expect(enlite.open()).resolves.toBeTruthy();
  enlite.addDeviceClass(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER, DeviceTest);
  await new Promise<void>(resolve => {
    enlite.once('device-created', device => {
      expect(device).toBeInstanceOf(DeviceTest);
      resolve();
    });
    adaptor.socket?.emit('message', frame.buffer, rinfo);
  });
  await expect(enlite.close()).resolves.toBeUndefined();
});
