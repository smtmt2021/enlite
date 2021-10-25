/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { FrameParams, TimeValue } from './interfaces';
import { ESV } from './esv';

/**
 *  Convert number to hex-decimal string.
 *  @param n     to be converted.
 *  @param bytes number of bytes, e.g. 2 bytes means 4 digits.
 */
export function num2hex(n: number, bytes = 2): string {
  if (n > Number.MAX_SAFE_INTEGER) {
    throw new Error(`the specified number is too large, ${n}`);
  }
  if (bytes < 1 || bytes > 8) {
    throw new TypeError(`invalid size of bytes, $${bytes}`);
  }
  return n
    .toString(16)
    .toUpperCase()
    .padStart(bytes * 2, '0');
}

export function dumpFrameParams(params: FrameParams): string {
  let result = '';
  if (params.tid) {
    result += `tid:${num2hex(params.tid, 2)} `;
  }
  if (params.seoj) {
    result += `seoj:${num2hex(params.seoj, 3)} `;
  }
  if (params.deoj) {
    result += `deoj:${num2hex(params.deoj, 3)} `;
  }
  for (const property of params.properties) {
    result += property.toString();
  }
  return result;
}

export function getResponseService(esv: ESV): ESV {
  switch (esv) {
    case ESV.GET:
      return ESV.GET_RES;
    case ESV.INFC:
      return ESV.INFC_RES;
  }
  return esv;
}

export function edt2DateValue(edt?: Buffer): TimeValue | undefined {
  if (!edt || edt.length !== 11) {
    return;
  }
  const year = edt.readUInt16BE(0);
  const month = edt.readUInt8(2) - 1;
  const day = edt.readUInt8(3);
  const hour = edt.readUInt8(4);
  const minuite = edt.readUInt8(5);
  const second = edt.readUInt8(6);
  const value = edt.readUInt32BE(7);
  const time = new Date(year, month, day, hour, minuite, second, 0);
  return { time, value };
}

export function dateValue2Buffer(time: Date, value: number): Buffer {
  const buffer = Buffer.alloc(11);
  buffer.writeUInt16BE(time.getFullYear());
  buffer.writeUInt8(time.getMonth() + 1, 2);
  buffer.writeUInt8(time.getDate(), 3);
  buffer.writeUInt8(time.getHours(), 4);
  buffer.writeUInt8(time.getMinutes(), 5);
  buffer.writeUInt8(time.getSeconds(), 6);
  buffer.writeUInt32BE(value, 7);
  return buffer;
}
