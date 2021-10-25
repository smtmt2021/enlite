/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Frame } from '../src/frame';
import { Property } from '../src/property';
import { FrameParams } from '../src/interfaces';
import { dumpFrameParams } from '../src/lib';
import { ESV } from '../src/esv';
import { EPC } from '../src/epc';

test('creating a frame #1', () => {
  const message = Buffer.from('1081006B0EF0010EF0017301D50401028801', 'hex');
  expect(new Frame(message).toString()).toMatchSnapshot();
});

test('creating a frame #2', () => {
  const message = Buffer.from('1081000002880105FF017201E70400000223', 'hex');
  const frame = new Frame(message);
  expect(frame.toString()).toMatchSnapshot();
  frame.tid = 0x1234;
  expect(frame.toString()).toMatchSnapshot();
  frame.tid = 0xfedc;
  expect(frame.toString()).toMatchSnapshot();
});

test('creating a frame #3 and confirmed it', () => {
  const message = Buffer.from('1081029F02880105FF017402EA0B07E501121200000000FBD2EB0B07E5011212000000000009', 'hex');
  const frame = new Frame(message);
  expect(frame.toString()).toMatchSnapshot();
  const params = Frame.confirmed(frame);
  expect(dumpFrameParams(params)).toMatchSnapshot();
  expect(Frame.create(params).toString()).toMatchSnapshot();
});

test('creating a frame from params #1', () => {
  const params: FrameParams = {
    esv: ESV.GET,
    properties: [new Property(EPC.INSTANCE_LIST_NOTIFICATION, Buffer.from('01028801', 'hex'))]
  };
  expect(() => Frame.create(params)).toThrowErrorMatchingSnapshot();
  params.tid = 0x2345;
  expect(() => Frame.create(params)).toThrowErrorMatchingSnapshot();
  params.seoj = 0x678910;
  expect(() => Frame.create(params)).toThrowErrorMatchingSnapshot();
  params.deoj = 0xabcdef;
  expect(Frame.create(params).toString()).toMatchSnapshot();
});

test('creating a frame from params #2', () => {
  const params: FrameParams = {
    tid: 0x1234,
    seoj: 0x567890,
    deoj: 0xabcdef,
    esv: ESV.GET,
    properties: []
  };
  expect(Frame.create(params).toString()).toMatchSnapshot();
});
