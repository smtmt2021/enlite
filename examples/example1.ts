/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EnliteGetInstance, SmartElectricEnergyMeter, CLASS, Device } from '../src';

// Your application for smart meter
class MySmartMeter extends SmartElectricEnergyMeter {
  private min = Number.MAX_VALUE;
  private max = Number.MIN_VALUE;
  private timer?: NodeJS.Timeout;
  private _coefficient?: number;
  private _digits?: number;
  private _unit?: number;
  private get coefficient() {
    return this._coefficient ?? 0;
  }

  private get digits() {
    return this._digits ?? 0;
  }

  private get unit() {
    return this._unit ?? 0;
  }

  private get unitkWh() {
    switch (this.unit) {
      case 0: return 1;
      case 1: return 0.1;
      case 2: return 0.01;
      case 3: return 0.001;
      case 4: return 0.0001;
      case 10: return 10;
      case 11: return 100;
      case 12: return 1000;
      case 13: return 10000;
      default: return 0;
    }
  }

  private getKwh(value: number) {
    value = value % Math.pow(10, this.digits);
    return value * this.coefficient * this.unitkWh;
  }

  async open(): Promise<boolean> {
    if (!await super.open()) {
      return false;
    }
    this._coefficient = await this.getCoefficient();
    this._digits = await this.getEffectiveDigits();
    this._unit = await this.getUnit();
    console.info(`example1: coefficient=${this.coefficient}, digits=${this.digits}, unit=${this.unit}`);
    this.on('cumulative-amounts-of-energy-normal', (time: Date, value: number) => this.onNormal(time, value));
    this.on('cumulative-amounts-of-energy-reverse', (time: Date, value: number) => this.onReverse(time, value));
    this.startPolling();
    return true;
  }

  close(): Promise<boolean> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    return super.close();
  }

  private startPolling() {
    this.timer = setInterval(async () => {
      try {
        const watt = await this.getInstantaneousElectricEnergey();
        if (!watt) {
          console.info('example1: failed to retrieve a current value');
          return;
        }
        this.min = Math.min(watt, this.min);
        this.max = Math.max(watt, this.max);
        console.log(`example1: ${watt}W ${this.min}W(min)/${this.max}W(max)`);
      } catch (err) {
        console.error('example1: ', err);
      }
    }, 60 * 1000);
  }

  private onNormal(time: Date, value: number) {
    const kWh = this.getKwh(value);
    console.log(`example1: cumulative amounts of energy normal = ${kWh} kWh@${time.toString()}`);
  }

  private onReverse(time: Date, value: number) {
    const kWh = this.getKwh(value);
    console.log(`example1: cumulative amounts of energy reverse = ${kWh} kWh@${time.toString()}`);
  }
}

// main code
async function main() {
  const hitAnyKey = () => new Promise<void>(resolve => {
    console.log('example1: hit any key to end');
    process.stdin.on('data', () => resolve());
  });
  try {
    const enlite = EnliteGetInstance();
    enlite.once('device-created', async (device: Device) => {
      console.log(`example1: ${device.constructor.name} created`);
      await device.open();
    });
    enlite.addDeviceClass(CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER, MySmartMeter);
    await enlite.open();
    await hitAnyKey();
    await enlite.close();
  } catch (err) {
    console.error('example1:', err);
  }
  process.exit(1);
}

// Let's go
main().catch(err => {
  console.error(err);
  process.exit(1);
});
