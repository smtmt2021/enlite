/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import * as Lib from '../src/lib';
import { ESV } from '../src/esv';

test.each([
  [1, 1, '01'],
  [1, 2, '0001'],
  [0x12, 3, '000012'],
  [0x1234, 4, '00001234'],
  [0x123456, 5, '0000123456'],
  [0x123456789, 6, '000123456789'],
  [0x123456789abc, 7, '00123456789ABC'],
  [0x1fffffffffffff, 8, '001FFFFFFFFFFFFF']
])('num2hex(%i, %i)', (a, b, expected) => {
  expect(Lib.num2hex(a, b)).toBe(expected);
});

test('num2hex', () => {
  expect(Lib.num2hex(1)).toBe('0001');
  expect(() => Lib.num2hex(Number.MAX_SAFE_INTEGER + 1, 8)).toThrowErrorMatchingSnapshot();
  expect(() => Lib.num2hex(0, 0)).toThrowErrorMatchingSnapshot();
  expect(() => Lib.num2hex(0, 9)).toThrowErrorMatchingSnapshot();
});

test.each([
  [ESV.GET, ESV.GET_RES],
  [ESV.INFC, ESV.INFC_RES]
])('getResponseService %s', (esv, expected) => {
  expect(Lib.getResponseService(esv)).toBe(expected);
});

test.each([
  ['07E40c1f173b3b12345678', { time: new Date(2020, 11, 31, 23, 59, 59, 0), value: 0x12345678 }],
  ['07E5010100000012345678', { time: new Date(2021, 0, 1, 0, 0, 0, 0), value: 0x12345678 }],
  ['07E5010109000012345678', { time: new Date(2021, 0, 1, 9, 0, 0, 0), value: 0x12345678 }],
  ['07E50101090000123456', undefined],
  ['07E501010900001234567890', undefined]
])('edt2DateValue %s', (s, expected) => {
  const edt = Buffer.from(s, 'hex');
  expect(Lib.edt2DateValue(edt)).toEqual(expected);
});

test.each([
  [{ time: new Date(2020, 11, 31, 23, 59, 59, 0), value: 0x12345678 }, '07e40c1f173b3b12345678'],
  [{ time: new Date(2021, 0, 1, 0, 0, 0, 0), value: 0x12345678 }, '07e5010100000012345678'],
  [{ time: new Date(2021, 0, 1, 9, 0, 0, 0), value: 0x12345678 }, '07e5010109000012345678']
])('edt2DateValue', (dv, expected) => {
  expect(Lib.dateValue2Buffer(dv.time, dv.value).toString('hex')).toEqual(expected);
});
