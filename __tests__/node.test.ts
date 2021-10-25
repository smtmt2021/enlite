/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Node } from '../src/node';
import { Frame } from '../src/frame';
import { CLASS } from '../src/device-class';

class NodeTest extends Node {
  getNextTid(): number {
    return super.getNextTid();
  }

  onGetRes = jest.fn((address: string, frame: Frame) => super.onGetRes(address, frame));
  onInf = jest.fn((address: string, frame: Frame) => super.onInf(address, frame));
  onInfC = jest.fn((address: string, frame: Frame) => super.onInfC(address, frame));
}

test('creatting a node', () => {
  const node1 = new NodeTest(CLASS.NODE_PROFILE);
  expect(node1.id).toEqual(CLASS.NODE_PROFILE * 0x100 + 1);

  const node2 = new NodeTest(CLASS.CONTROLLER, 1);
  expect(node2.id).toEqual(CLASS.CONTROLLER * 0x100 + 1);

  const node3 = new NodeTest(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER, 2);
  expect(node3.id).toEqual(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER * 0x100 + 2);

  expect(() => new NodeTest(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER, 0x100)).toThrowErrorMatchingSnapshot();
  expect(() => new NodeTest(CLASS.NODE_PROFILE, 0)).toThrowErrorMatchingSnapshot();
});

test('open and close', async () => {
  const node = new NodeTest(CLASS.NODE_PROFILE);
  await expect(node.open()).resolves.toBeTruthy();
  await expect(node.close()).resolves.toBeTruthy();
});

test('tid is incremented one by one', () => {
  const node = new NodeTest(CLASS.NODE_PROFILE);
  expect(node.getNextTid()).toEqual(1);
  expect(node.getNextTid()).toEqual(2);
  for (let i = 0; i < 0xfffc; ++i) {
    node.getNextTid();
  }
  expect(node.getNextTid()).toEqual(0x0ffff);
  expect(node.getNextTid()).toEqual(0);
});

test('onData to onInf', async () => {
  const node = new NodeTest(CLASS.NODE_PROFILE);
  const frame = new Frame(Buffer.from('1081006B0EF0010EF0017301D50401028801', 'hex'));
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0001';
  await expect(node.open()).resolves.toBeTruthy();
  await expect(node.onData(address, frame)).resolves.toBeUndefined();
  expect(node.onGetRes.mock.calls.length).toBe(0);
  expect(node.onInf.mock.calls.length).toBe(1);
  expect(node.onInfC.mock.calls.length).toBe(0);
  expect(node.onInf.mock.calls[0][0]).toBe(address);
  expect(node.onInf.mock.calls[0][1]).toBe(frame);
  await expect(node.close()).resolves.toBeTruthy();
});

test('onData to onGetRes', async () => {
  const node = new NodeTest(CLASS.NODE_PROFILE);
  const frame = new Frame(Buffer.from('1081000205ff010288017201e700', 'hex'));
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0002';
  await expect(node.open()).resolves.toBeTruthy();
  await expect(node.onData(address, frame)).resolves.toBeUndefined();
  expect(node.onGetRes.mock.calls.length).toBe(1);
  expect(node.onInf.mock.calls.length).toBe(0);
  expect(node.onInfC.mock.calls.length).toBe(0);
  expect(node.onGetRes.mock.calls[0][0]).toBe(address);
  expect(node.onGetRes.mock.calls[0][1]).toBe(frame);
  await expect(node.close()).resolves.toBeTruthy();
});

test('onData to onInfC', async () => {
  const node = new NodeTest(CLASS.NODE_PROFILE);
  const frame = new Frame(Buffer.from('1081029F02880105FF017402EA0B07E501121200000000FBD2EB0B07E5011212000000000009', 'hex'));
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0003';
  await expect(node.open()).resolves.toBeTruthy();
  await expect(node.onData(address, frame)).resolves.toBeUndefined();
  expect(node.onGetRes.mock.calls.length).toBe(0);
  expect(node.onInf.mock.calls.length).toBe(0);
  expect(node.onInfC.mock.calls.length).toBe(1);
  expect(node.onInfC.mock.calls[0][0]).toBe(address);
  expect(node.onInfC.mock.calls[0][1]).toBe(frame);
  await expect(node.close()).resolves.toBeTruthy();
});

test('onData to Get?', async () => {
  const node = new NodeTest(CLASS.NODE_PROFILE);
  const frame = new Frame(Buffer.from('1081000205ff010288016201e700', 'hex'));
  const address = 'fe80:0000:0000:0000:0000:0000:0000:0004';
  await expect(node.open()).resolves.toBeTruthy();
  await expect(node.onData(address, frame)).resolves.toBeUndefined();
  expect(node.onGetRes.mock.calls.length).toBe(0);
  expect(node.onInf.mock.calls.length).toBe(0);
  expect(node.onInfC.mock.calls.length).toBe(0);
  await expect(node.close()).resolves.toBeTruthy();
});
