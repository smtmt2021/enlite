/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EPC } from './epc';
import { num2hex } from './lib';

export class Property {
  static confirmed(property: Property): Property {
    return new Property(property.epc);
  }

  constructor(public epc: EPC, public edt?: Buffer) {}

  get pdc(): number {
    return this.edt ? this.edt.length : 0;
  }

  toString(): string {
    let result = 'epc:' + num2hex(this.epc, 1);
    result += ' pdc:' + num2hex(this.pdc, 1);
    if (this.edt) {
      result += ' edt:';
      for (const edt of this.edt) {
        result += num2hex(edt, 1) + ' ';
      }
    } else {
      result += ' ';
    }
    return result;
  }
}
