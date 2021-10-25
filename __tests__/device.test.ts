/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Node } from '../src/node';
import { Device } from '../src/device';
import { Frame } from '../src/frame';
import { Property } from '../src/property';
import { FrameParams, SendToRemote } from '../src/interfaces';
import { getResponseService } from '../src/lib';
import { CLASS } from '../src/device-class';
import { ESV } from '../src/esv';
import { EPC } from '../src/epc';

class ControllerTest extends Node implements SendToRemote {
  send = jest.fn((params: FrameParams, address: string) => {
    params.seoj = this.id;
    return Promise.resolve();
  });
}

class DeviceTest extends Device {
  Get(properties: Property[]): Promise<Property[]> {
    return super.Get(properties);
  }
}

beforeAll(async () => {
  jest.setTimeout(20 * 1000);
});

test('device response to InfC', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0001';
  const device = new DeviceTest(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const frame = new Frame(Buffer.from('1081029F02880105FF017402EA0B07E501121200000000FBD2EB0B07E5011212000000000009', 'hex'));

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  expect(device.onData(address, frame)).resolves.toBeUndefined();
  expect(controller.send.mock.calls.length).toBe(1);
  expect(controller.send.mock.calls[0][0]).toEqual({
    tid: 0x029f,
    seoj: 0x05ff01,
    deoj: 0x028801,
    esv: ESV.INFC_RES,
    properties: [
      new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_NORMAL),
      new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_REVERSE)
    ]
  });
  expect(controller.send.mock.calls[0][1]).toBe(address);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('Get', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new DeviceTest(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY);
  const edt = Buffer.from('01234567', 'hex');

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  controller.send = jest.fn((params: FrameParams, address: string) => {
    [params.seoj, params.deoj] = [params.deoj, controller.id];
    params.esv = getResponseService(params.esv);
    params.properties = [new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, edt)];
    const frame = Frame.create(params);
    setTimeout(() => device.onData(address, frame), 100);
    return Promise.resolve();
  });
  await expect(device.Get([property])).resolves
    .toEqual([new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, edt)]);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('Get and timeout', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0004';
  const device = new DeviceTest(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY);

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  await expect(device.Get([property])).rejects.toMatchSnapshot();
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('Get and wrong tid, then timeout', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new DeviceTest(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY);
  const edt = Buffer.from('01234567', 'hex');

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  controller.send = jest.fn((params: FrameParams, address: string) => {
    params.tid = 100;
    [params.seoj, params.deoj] = [params.deoj, controller.id];
    params.esv = getResponseService(params.esv);
    params.properties = [new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, edt)];
    const frame = Frame.create(params);
    setTimeout(() => device.onData(address, frame), 100);
    return Promise.resolve();
  });
  await expect(device.Get([property])).rejects.toMatchSnapshot();
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('getValue(4)', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new DeviceTest(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY);
  const edt = Buffer.from('12345678', 'hex');

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  controller.send = jest.fn((params: FrameParams, address: string) => {
    [params.seoj, params.deoj] = [params.deoj, controller.id];
    params.esv = getResponseService(params.esv);
    params.properties = [new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, edt)];
    const frame = Frame.create(params);
    setTimeout(() => device.onData(address, frame), 100);
    return Promise.resolve();
  });
  await expect(device.getValue(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, 4)).resolves.toBe(0x12345678);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('getValue(1)', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new DeviceTest(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const property = new Property(EPC.EFFECTIVE_DIGITS);
  const edt = Buffer.from('08', 'hex');

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  controller.send = jest.fn((params: FrameParams, address: string) => {
    [params.seoj, params.deoj] = [params.deoj, controller.id];
    params.esv = getResponseService(params.esv);
    params.properties = [new Property(EPC.EFFECTIVE_DIGITS, edt)];
    const frame = Frame.create(params);
    setTimeout(() => device.onData(address, frame), 100);
    return Promise.resolve();
  });
  await expect(device.getValue(EPC.EFFECTIVE_DIGITS, 1)).resolves.toBe(8);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});
