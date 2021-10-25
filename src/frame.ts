/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { FrameParams } from './interfaces';
import { Property } from './property';
import { EPC } from './epc';
import { ESV } from './esv';
import { num2hex, dumpFrameParams, getResponseService } from './lib';

const EHD = 0x1081;

export class Frame {
  static create(params: FrameParams): Frame {
    if (!params.tid || !params.seoj || !params.deoj || !params.esv) {
      throw new Error(`Frame: params are not enough ${dumpFrameParams(params)}`);
    }
    let data = num2hex(EHD, 2);
    data += num2hex(params.tid, 2);
    data += num2hex(params.seoj, 3);
    data += num2hex(params.deoj, 3);
    data += num2hex(params.esv, 1);
    data += num2hex(params.properties.length, 1); // as OPC
    for (const property of params.properties) {
      data += num2hex(property.epc, 1) + num2hex(property.pdc, 1);
      if (property.edt) {
        for (const dt of property.edt.values()) {
          data += num2hex(dt, 1);
        }
      }
    }
    return new Frame(Buffer.from(data, 'hex'));
  }

  static confirmed(frame: Frame): FrameParams {
    const properties: Property[] = [];
    for (const property of frame.properties) {
      properties.push(Property.confirmed(property));
    }
    return {
      tid: frame.tid,
      seoj: frame.deoj,
      deoj: frame.seoj,
      esv: getResponseService(frame.esv),
      properties
    };
  }

  constructor(public readonly buffer: Buffer) {}

  get ehd(): number {
    return this.buffer.readUInt16BE(0);
  }

  set tid(tid: number) {
    this.buffer.writeUInt16BE(tid, 2);
  }

  get tid(): number {
    return this.buffer.readUInt16BE(2);
  }

  get seoj(): number {
    return this.buffer.readUIntBE(4, 3);
  }

  get deoj(): number {
    return this.buffer.readUIntBE(7, 3);
  }

  get esv(): ESV {
    return this.buffer.readUInt8(10) as ESV;
  }

  get opc(): number {
    return this.buffer.readUInt8(11);
  }

  get properties(): Property[] {
    const properties: Property[] = [];
    const buffer = this.buffer.subarray(12);
    let offset = 0;
    for (let i = 0; i < this.opc; ++i) {
      const epc = buffer[offset++] as EPC;
      const pdc = buffer[offset++];
      const edt = pdc ? buffer.subarray(offset, offset + pdc) : undefined;
      properties.push(new Property(epc, edt));
      offset += pdc;
    }
    return properties;
  }

  toString(): string {
    let result = 'ehd:' + num2hex(this.ehd, 2)
      + ' tid:' + num2hex(this.tid, 2)
      + ' seoj:' + num2hex(this.seoj, 3)
      + ' deoj:' + num2hex(this.deoj, 3)
      + ' esv:' + num2hex(this.esv, 1)
      + ' opc:' + num2hex(this.opc, 1)
      + ' ';
    if (this.opc) {
      for (const property of this.properties) {
        result += property.toString();
      }
    }
    return result;
  }
}
