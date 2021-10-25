/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Enlite } from './enlite';
import { EnliteImpl } from './enlite-impl';
export { Enlite };
export { SendToRemote as Controller } from './interfaces';
export { Device } from './device';
export { CLASS } from './device-class';
export { SmartElectricEnergyMeter } from './smart-electric-energy-meter';

export function EnliteGetInstance(): Enlite {
  return EnliteImpl.getInstance();
}
