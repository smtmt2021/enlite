/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EventEmitter } from 'events';
import { Device } from './device';
import { SendToRemote } from './interfaces';
import { Frame } from './frame';
import { edt2DateValue } from './lib';
import { EPC } from './epc';
import { CLASS } from './device-class';
import DEBUG from 'debug';
const debug = DEBUG('enlite/device');

export type EventMeter = 'cumulative-amounts-of-energy-normal' | 'cumulative-amounts-of-energy-reverse';

export abstract class SmartElectricEnergyMeter extends Device {
  private eventMeter = new EventEmitter();
  private timeCumulativeAmountsOfEnergyNormal?: Date;
  private timeCumulativeAmountsOfEnergyReverse?: Date;

  constructor(controller: SendToRemote, address: string) {
    super(controller, address, CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER);
    debug('smart-electric-energy-meter created');
  }

  close(): Promise<boolean> {
    debug('smart-electric-energy-meter.close');
    this.eventMeter.removeAllListeners();
    return super.close();
  }

  on(en: EventMeter, listener: (time: Date, value: number) => void): void {
    this.eventMeter.on(en, listener);
  }

  getCoefficient(): Promise<number | undefined> {
    debug('smart-electric-energy-meter.getCoefficient');
    return this.getValue(EPC.COEFFICIENT, 4);
  }

  getEffectiveDigits(): Promise<number | undefined> {
    debug('smart-electric-energy-meter.getEffectiveDigits');
    return this.getValue(EPC.EFFECTIVE_DIGITS, 1);
  }

  getUnit(): Promise<number | undefined> {
    debug('smart-electric-energy-meter.getUnit');
    return this.getValue(EPC.UNIT, 1);
  }

  getInstantaneousElectricEnergey(): Promise<number | undefined> {
    debug('smart-electric-energy-meter.getInstantaneousElectricEnergey');
    return this.getValue(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, 4);
  }

  protected onCumulativeAmountsOfEnergyNormal(time: Date, value: number): Promise<void> {
    this.eventMeter.emit('cumulative-amounts-of-energy-normal', time, value);
    return Promise.resolve();
  }

  protected onCumulativeAmountsOfEnergyReverse(time: Date, value: number): Promise<void> {
    this.eventMeter.emit('cumulative-amounts-of-energy-reverse', time, value);
    return Promise.resolve();
  }

  protected async onInfC(address: string, frame: Frame): Promise<void> {
    debug('smart-electric-energy-meter.onInfC');
    for (const property of frame.properties) {
      switch (property.epc) {
        case EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_NORMAL: {
          const timevalue = edt2DateValue(property.edt);
          if (!timevalue || !this.isNewCumulativeAmountsOfEnergyNormal(timevalue.time)) {
            return;
          }
          await this.onCumulativeAmountsOfEnergyNormal(timevalue.time, timevalue.value);
          break;
        }
        case EPC.CUMULATIVE_AMOUNTS_OF_ENERGY_REVERSE: {
          const timevalue = edt2DateValue(property.edt);
          if (!timevalue || !this.isNewCumulativeAmountsOfEnergyReverse(timevalue.time)) {
            return;
          }
          await this.onCumulativeAmountsOfEnergyReverse(timevalue.time, timevalue.value);
          break;
        }
      }
    }
    const confirmed = Frame.confirmed(frame);
    debug('smart-electric-energy-meter.onInfC.confirmed', confirmed.toString(), address);
    return this.controller.send(confirmed, address);
  }

  private isNewCumulativeAmountsOfEnergyNormal(time: Date) {
    if (!this.timeCumulativeAmountsOfEnergyNormal) {
      this.timeCumulativeAmountsOfEnergyNormal = time;
      return true;
    }
    return this.timeCumulativeAmountsOfEnergyNormal.getTime() < time.getTime();
  }

  private isNewCumulativeAmountsOfEnergyReverse(time: Date) {
    if (!this.timeCumulativeAmountsOfEnergyReverse) {
      this.timeCumulativeAmountsOfEnergyReverse = time;
      return true;
    }
    return this.timeCumulativeAmountsOfEnergyReverse.getTime() < time.getTime();
  }
}
