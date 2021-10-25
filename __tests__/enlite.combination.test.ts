/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
jest.unmock('@smtmt2021/wsun-adaptor');
import { writeFileSync } from 'fs';
import { dateValue2Buffer } from '../src/lib';
import { Bp35a1Robot as Robot, MockBinding, SerialPort } from '@smtmt2021/wsun-adaptor-mock';
import { EnliteGetInstance, CLASS, SmartElectricEnergyMeter, Enlite } from '../src';
import { Property } from '../src/property';
import { Frame } from '../src/frame';
import { PORT_ENLITE } from '../src/definitions';
import { ESV } from '../src/esv';
import { EPC } from '../src/epc';

const FAKE_PORT = '/dev/ROBOT';
const FAKE_ID = '0123456789ABCDEF0123456789ABCDEF';
const FAKE_PASSWORD = 'ABDEFGHIJKLM';
const MY_DEVICE_IPV6 = '2001:0000:0000:0000:0000:0000:0000:0001';

class DeviceTest extends SmartElectricEnergyMeter {}

let enlite: Enlite;
let deviceTest: DeviceTest;

beforeAll(() => {
  const configFilePath = './.enlite.json';
  const config = {
    wsun: {
      adaptor: 'BP35A1',
      id: {
        id: FAKE_ID,
        password: FAKE_PASSWORD
      },
      config: {
        device: FAKE_PORT
      }
    }
  };
  writeFileSync(configFilePath, JSON.stringify(config, null, '  '));
  (SerialPort as any).Binding = Robot;
  MockBinding.createPort(FAKE_PORT, { echo: false, record: true });
  enlite = EnliteGetInstance();
});

test('opening an enlite', async () => {
  enlite.addDeviceClass(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER, DeviceTest);
  await expect(enlite.open()).resolves.toBeTruthy();
});

test('creating a device', async () => {
  await expect(new Promise<void>(resolve => {
    const edt = Buffer.from('01028801', 'hex');
    const property = new Property(EPC.INSTANCE_LIST_NOTIFICATION, edt);
    const frame = Frame.create({
      tid: 1,
      seoj: CLASS.NODE_PROFILE * 0x100 + 1,
      deoj: CLASS.NODE_PROFILE * 0x100 + 1,
      esv: ESV.INF,
      properties: [property]
    });
    enlite.once('device-created', device => {
      expect(device).toBeInstanceOf(DeviceTest);
      deviceTest = device as SmartElectricEnergyMeter;
      resolve();
    });
    Robot.instance.sendBack(MY_DEVICE_IPV6, PORT_ENLITE, PORT_ENLITE, frame.buffer);
  })).resolves.toBeUndefined();
});

test('receiving an infc', async () => {
  const device = deviceTest;
  const time = new Date(2021, 0, 1, 0, 0, 0, 0);
  const nomal = 1234;
  const reverse = 5678;
  let listener1: (time: Date, value: number) => void;
  let listener2: (time: Date, value: number) => void;
  await expect(device.open()).resolves.toBeTruthy();
  await new Promise<void>(resolve => {
    device.on('cumulative-amounts-of-energy-normal', listener1 = (time: Date, value: number) => {
      expect(time).toEqual(time);
      expect(value).toBe(nomal);
    });
    device.on('cumulative-amounts-of-energy-reverse', listener2 = (time: Date, value: number) => {
      expect(time).toEqual(time);
      expect(value).toBe(reverse);
      resolve();
    });
    const frame = Frame.create({
      tid: 1,
      seoj: CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER * 0x100 + 1,
      deoj: CLASS.CONTROLLER * 0x100 + 1,
      esv: ESV.INFC,
      properties: [
        new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_NORMAL, dateValue2Buffer(time, nomal)),
        new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_REVERSE, dateValue2Buffer(time, reverse))
      ]
    });
    Robot.instance.sendBack(MY_DEVICE_IPV6, PORT_ENLITE, PORT_ENLITE, frame.buffer);
  });
});

test('trying to get', async () => {
  const device = deviceTest;
  const value = 1234;
  const edt = Buffer.alloc(4);
  edt.writeUInt32BE(value);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, edt);
  const frame = Frame.create({
    tid: 1,
    seoj: CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER * 0x100 + 1,
    deoj: CLASS.CONTROLLER * 0x100 + 1,
    esv: ESV.GET_RES,
    properties: [property]
  });

  setTimeout(() => Robot.instance.sendBack(MY_DEVICE_IPV6, PORT_ENLITE, PORT_ENLITE, frame.buffer), 10);
  await expect(device.getInstantaneousElectricEnergey()).resolves.toBe(value);
});

test('closing the enlite', async () => {
  await expect(enlite.close()).resolves.toBeUndefined();
});
