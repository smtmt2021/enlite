/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Node } from '../src/node';
import { Controller } from '../src/controller';
import { Device } from '../src/device';
import { Frame } from '../src/frame';
import { SendToRemote, FrameParams } from '../src/interfaces';
import { CLASS } from '../src/device-class';
import { ESV } from '../src/esv';
import { EPC } from '../src/epc';
import { Property } from '../src/property';

class ControllerTest extends Controller {
}

class NodeProfileTest extends Node implements SendToRemote {
  send = jest.fn((params: FrameParams, address: string) => Promise.resolve());
}

class DeviceTest extends Device {
  ongetres = jest.fn();
  protected onGetRes(address: string, frame: Frame): Promise<void> {
    this.ongetres(address, frame);
    return Promise.resolve();
  }
}

test('crate, open & close a controller', async () => {
  const nodeprofile = new NodeProfileTest(CLASS.NODE_PROFILE);
  const controller = new ControllerTest(nodeprofile);
  expect(controller.id).toBe(CLASS.CONTROLLER * 0x100 + 1);
  expect(controller.isOpen).toBeFalsy();
  await expect(controller.open()).resolves.toBeTruthy();
  expect(controller.isOpen).toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
  expect(controller.isOpen).toBeFalsy();
});

test('add a device', async () => {
  const nodeprofile = new NodeProfileTest(CLASS.NODE_PROFILE);
  const controller = new ControllerTest(nodeprofile);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0001';
  const device = new DeviceTest(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  await expect(controller.open()).resolves.toBeTruthy();
  await expect(controller.addDevice(device)).resolves.toBeTruthy();
  await expect(controller.addDevice(device)).resolves.toBeFalsy();
  await expect(controller.close()).resolves.toBeTruthy();

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(controller.addDevice(device)).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('add devices', async () => {
  const nodeprofile = new NodeProfileTest(CLASS.NODE_PROFILE);
  const controller = new ControllerTest(nodeprofile);
  const address1 = 'fe80:0000:0000:0000:0000:0000:0000:0001';
  const address2 = 'fe80:0000:0000:0000:0000:0000:0000:0002';
  const device1 = new DeviceTest(controller, address1, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const device2 = new DeviceTest(controller, address2, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const device3 = new DeviceTest(controller, address1, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER + 1);
  await expect(controller.open()).resolves.toBeTruthy();
  await expect(controller.addDevice(device1)).resolves.toBeTruthy();
  await expect(controller.addDevice(device2)).resolves.toBeTruthy();
  await expect(controller.addDevice(device3)).resolves.toBeTruthy();
  await expect(controller.close()).resolves.toBeTruthy();
});

test('send a frame, open & close a controller', async () => {
  const nodeprofile = new NodeProfileTest(CLASS.NODE_PROFILE);
  const controller = new ControllerTest(nodeprofile);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY);
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0004';
  const params = {
    tid: 1234,
    deoj: CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER * 0x100 + 1,
    esv: ESV.GET,
    properties: [property]
  };

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(controller.send(params, address)).resolves.toBeUndefined();
  expect(nodeprofile.send.mock.calls.length).toBe(1);
  expect(nodeprofile.send.mock.calls[0][0]).toEqual({
    tid: 1234,
    seoj: CLASS.CONTROLLER * 0x100 + 1,
    deoj: CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER * 0x100 + 1,
    esv: ESV.GET,
    properties: [property]
  });
  expect(nodeprofile.send.mock.calls[0][1]).toBe(address);
  await expect(controller.close()).resolves.toBeTruthy();
});

test('receive a response to a device', async () => {
  const nodeprofile = new NodeProfileTest(CLASS.NODE_PROFILE);
  const controller = new ControllerTest(nodeprofile);
  const address1 = 'fe80:0000:0000:0000:0000:0000:0000:0001';
  const address2 = 'fe80:0000:0000:0000:0000:0000:0000:0002';
  const device1 = new DeviceTest(controller, address1, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const device2 = new DeviceTest(controller, address2, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  const device3 = new DeviceTest(controller, address1, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER + 1);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, Buffer.from('12345678', 'hex'));
  const frame = Frame.create({
    tid: 5678,
    seoj: CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER * 0x100 + 1,
    deoj: CLASS.CONTROLLER * 0x100 + 1,
    esv: ESV.GET_RES,
    properties: [property]
  });

  await expect(controller.open()).resolves.toBeTruthy();
  await expect(controller.addDevice(device1)).resolves.toBeTruthy();
  await expect(controller.addDevice(device2)).resolves.toBeTruthy();
  await expect(controller.addDevice(device3)).resolves.toBeTruthy();
  await expect(device1.open()).resolves.toBeTruthy();
  await expect(device2.open()).resolves.toBeTruthy();
  await expect(device3.open()).resolves.toBeTruthy();
  await expect(controller.onData(address1, frame)).resolves.toBeUndefined();
  expect(device1.ongetres.mock.calls.length).toBe(1);
  expect(device2.ongetres.mock.calls.length).toBe(0);
  expect(device3.ongetres.mock.calls.length).toBe(0);
  expect(device1.ongetres.mock.calls[0][0]).toBe(address1);
  expect(device1.ongetres.mock.calls[0][1]).toEqual(frame);
  await expect(controller.close()).resolves.toBeTruthy();
});
