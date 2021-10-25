/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Node } from '../src/node';
import { SmartElectricEnergyMeter } from '../src';
import { Frame } from '../src/frame';
import { Property } from '../src/property';
import { FrameParams, SendToRemote } from '../src/interfaces';
import { getResponseService, dateValue2Buffer } from '../src/lib';
import { CLASS } from '../src/device-class';
import { EPC } from '../src/epc';
import { ESV } from '../src/esv';

class ControllerTest extends Node implements SendToRemote {
  send = jest.fn((params: FrameParams, address: string) => {
    params.seoj = this.id;
    return Promise.resolve();
  });
}

class SmartElectricEnergyMeterTest extends SmartElectricEnergyMeter {
  getInstantaneousElectricEnergey(): Promise<number | undefined> {
    return super.getInstantaneousElectricEnergey();
  }

  normal = jest.fn();
  protected onCumulativeAmountsOfEnergyNormal(time: Date, value: number): Promise<void> {
    this.normal(time, value);
    return Promise.resolve();
  }

  reverse = jest.fn();
  protected onCumulativeAmountsOfEnergyReverse(time: Date, value: number): Promise<void> {
    this.reverse(time, value);
    return Promise.resolve();
  }
}

test('getCoefficient', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new SmartElectricEnergyMeterTest(controller, address);
  const edt = Buffer.from('12345678', 'hex');

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  controller.send = jest.fn((params: FrameParams, address: string) => {
    [params.seoj, params.deoj] = [params.deoj, controller.id];
    params.esv = getResponseService(params.esv);
    params.properties = [new Property(EPC.COEFFICIENT, edt)];
    const frame = Frame.create(params);
    setTimeout(() => device.onData(address, frame), 100);
    return Promise.resolve();
  });
  await expect(device.getCoefficient()).resolves.toBe(0x12345678);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('getEffectiveDigits', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new SmartElectricEnergyMeterTest(controller, address);
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
  await expect(device.getEffectiveDigits()).resolves.toBe(8);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('getUnit', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new SmartElectricEnergyMeterTest(controller, address);
  const edt = Buffer.from('01', 'hex');

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  controller.send = jest.fn((params: FrameParams, address: string) => {
    [params.seoj, params.deoj] = [params.deoj, controller.id];
    params.esv = getResponseService(params.esv);
    params.properties = [new Property(EPC.UNIT, edt)];
    const frame = Frame.create(params);
    setTimeout(() => device.onData(address, frame), 100);
    return Promise.resolve();
  });
  await expect(device.getUnit()).resolves.toBe(1);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('getInstantaneousElectricEnergey', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  const device = new SmartElectricEnergyMeterTest(controller, address);
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
  await expect(device.getInstantaneousElectricEnergey()).resolves.toBe(0x12345678);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('getInstantaneousElectricEnergey, and get an errorneous data', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0004';
  const device = new SmartElectricEnergyMeterTest(controller, address);
  const edt = Buffer.from('1234', 'hex');

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
  await expect(device.getInstantaneousElectricEnergey()).resolves.toBeUndefined();
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('cumulative amounts of energy normal', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0005';
  const device = new SmartElectricEnergyMeterTest(controller, address);
  const time = new Date();
  time.setMilliseconds(0);
  const value = 0x1234;
  const property = new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_NORMAL, dateValue2Buffer(time, value));
  const params: FrameParams = {
    tid: 1,
    seoj: 0x028801,
    deoj: 0x05ff01,
    esv: ESV.INFC,
    properties: [property]
  };
  const frame = Frame.create(params);

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  await expect(device.onData(address, frame)).resolves.toBeUndefined();
  expect(device.normal.mock.calls.length).toBe(1);
  expect(device.reverse.mock.calls.length).toBe(0);
  expect(device.normal.mock.calls[0][0]).toEqual(time);
  expect(device.normal.mock.calls[0][1]).toBe(value);

  await expect(device.onData(address, frame)).resolves.toBeUndefined();
  expect(device.normal.mock.calls.length).toBe(1);
  expect(device.reverse.mock.calls.length).toBe(0);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('cumulative amounts of energy reverse', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0006';
  const device = new SmartElectricEnergyMeterTest(controller, address);
  const time = new Date();
  time.setMilliseconds(0);
  const value = 10000;
  const property = new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_REVERSE, dateValue2Buffer(time, value));
  const params: FrameParams = {
    tid: 1,
    seoj: 0x028801,
    deoj: 0x05ff01,
    esv: ESV.INFC,
    properties: [property]
  };
  const frame = Frame.create(params);

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  await expect(device.onData(address, frame)).resolves.toBeUndefined();
  expect(device.normal.mock.calls.length).toBe(0);
  expect(device.reverse.mock.calls.length).toBe(1);
  expect(device.reverse.mock.calls[0][0]).toEqual(time);
  expect(device.reverse.mock.calls[0][1]).toBe(value);

  await expect(device.onData(address, frame)).resolves.toBeUndefined();
  expect(device.normal.mock.calls.length).toBe(0);
  expect(device.reverse.mock.calls.length).toBe(1);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('cumulative amounts of energy normal & reverse', async () => {
  const controller = new ControllerTest(CLASS.CONTROLLER);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0005';
  const device = new SmartElectricEnergyMeterTest(controller, address);
  const time = new Date();
  time.setMilliseconds(0);
  const valueNormal = 10000;
  const valueReverse = 20000;
  const propertyNormal = new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_NORMAL, dateValue2Buffer(time, valueNormal));
  const propertyReverse = new Property(EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_REVERSE, dateValue2Buffer(time, valueReverse));
  const params: FrameParams = {
    tid: 1,
    seoj: 0x028801,
    deoj: 0x05ff01,
    esv: ESV.INFC,
    properties: [propertyNormal, propertyReverse]
  };
  const frame = Frame.create(params);

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(device.open()).resolves.toBeTruthy();
  await expect(device.onData(address, frame)).resolves.toBeUndefined();
  expect(device.normal.mock.calls.length).toBe(1);
  expect(device.reverse.mock.calls.length).toBe(1);
  expect(device.normal.mock.calls[0][0]).toEqual(time);
  expect(device.normal.mock.calls[0][1]).toBe(valueNormal);
  expect(device.reverse.mock.calls[0][0]).toEqual(time);
  expect(device.reverse.mock.calls[0][1]).toBe(valueReverse);

  await expect(device.onData(address, frame)).resolves.toBeUndefined();
  expect(device.normal.mock.calls.length).toBe(1);
  expect(device.reverse.mock.calls.length).toBe(1);
  await expect(device.close()).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});
