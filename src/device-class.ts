/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
export enum CLASS {
  NODE_PROFILE = 0x0ef0,
  CONTROLLER = 0x05ff,
  LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER = 0x0288
}

export type ClassType = CLASS.NODE_PROFILE | CLASS.CONTROLLER | CLASS.LOW_VOLTAGE_SMART_ELECTRIC_ENERGY_METER;
