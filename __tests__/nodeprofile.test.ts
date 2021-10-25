/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EventEmitter } from 'events';
import { EnliteSocket } from '../src/enlite-impl';
import { NodeProfile } from '../src/nodeprofile';
import { Controller } from '../src/controller';
import { Device } from '../src/device';
import { Property } from '../src/property';
import { SendToRemote, EnliteLocal } from '../src/interfaces';
import { Frame } from '../src/frame';
import { CLASS } from '../src/device-class';
import { ESV } from '../src/esv';
import { EPC } from '../src/epc';
import { PORT_ENLITE } from '../src/definitions';

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

class NodeProfileTest extends NodeProfile {
}

class SocketTest extends EventEmitter implements EnliteSocket {
  bind(port: number): Promise<void> {
    return Promise.resolve();
  }

  send = jest.fn((msg: Buffer, port: number, address: string) => Promise.resolve());

  close(): Promise<void> {
    return Promise.resolve();
  }
}

class EnliteTest implements EnliteLocal {
  socket?: SocketTest;
  _createdevice = jest.fn();
  createDevice(controller: Controller, deviceClass: CLASS, address: string, instanceCode?: number): Device | undefined {
    this._createdevice(controller, deviceClass, address, instanceCode);
    return new DeviceTest(controller, address, deviceClass, instanceCode);
  }

  createSocket(): SocketTest {
    return this.socket = new SocketTest();
  }
}

class ControllerTest extends Controller {
  constructor(nodeProfile: SendToRemote, public done = () => {}) {
    super(nodeProfile);
  }

  adddevice = jest.fn();

  addDevice(device: Device): Promise<boolean> {
    this.adddevice(device);
    const result = super.addDevice(device);
    this.done();
    return result;
  }
}

test('open and close nodeprofile', async () => {
  const enlite = new EnliteTest();
  const nodeprofile = new NodeProfileTest(enlite);
  const controller = new ControllerTest(nodeprofile);

  await expect(nodeprofile.open(controller)).resolves.toBeTruthy();
  await expect(nodeprofile.close()).resolves.toBeTruthy();

  await expect(nodeprofile.open(controller)).resolves.toBeTruthy();
  await expect(nodeprofile.close()).resolves.toBeTruthy();
});

test('send a message', async () => {
  const enlite = new EnliteTest();
  const nodeprofile = new NodeProfileTest(enlite);
  const controller = new ControllerTest(nodeprofile);
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY);
  const params = {
    tid: 1,
    seoj: CLASS.CONTROLLER * 0x100 + 1,
    deoj: CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER * 0x100 + 1,
    esv: ESV.GET,
    properties: [property]
  };
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0001';

  await expect(nodeprofile.open(controller)).resolves.toBeTruthy();
  await expect(nodeprofile.send(params, address)).resolves.toBeUndefined();
  expect(enlite.socket!.send.mock.calls.length).toBe(1);
  expect(enlite.socket!.send.mock.calls[0][0]).toEqual(Frame.create(params).buffer);
  expect(enlite.socket!.send.mock.calls[0][1]).toBe(PORT_ENLITE);
  expect(enlite.socket!.send.mock.calls[0][2]).toBe(address);
  await expect(nodeprofile.close()).resolves.toBeTruthy();
});

test('receive a message', async () => {
  const enlite = new EnliteTest();
  const nodeprofile = new NodeProfileTest(enlite);
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

  let controller: ControllerTest;
  await new Promise<void>(async resolve => {
    const done = () => resolve();
    controller = new ControllerTest(nodeprofile, done);
    await expect(nodeprofile.open(controller)).resolves.toBeTruthy();
    enlite.socket?.emit('message', frame.buffer, rinfo);
  });

  expect(enlite._createdevice.mock.calls.length).toBe(1);
  expect(enlite._createdevice.mock.calls[0][0]).toEqual(controller!);
  expect(enlite._createdevice.mock.calls[0][1]).toBe(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
  expect(enlite._createdevice.mock.calls[0][2]).toBe(rinfo.address);
  expect(controller!.adddevice.mock.calls.length).toBe(1);
  expect(controller!.adddevice.mock.calls[0][0]).toBeInstanceOf(DeviceTest);
  await expect(nodeprofile.close()).resolves.toBeTruthy();
});
