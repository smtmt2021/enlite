/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { DeviceConstructor } from './interfaces';
import { Device } from './device';
import { CLASS } from './device-class';

export type EventSession =
  'session-established' |
  'session-ending' |
  'session-ended' |
  'session-error' |
  'session-timeout' |
  'session-108-start' |
  'session-108-end';
export type EventDevice =
  'device-created';
export type EventEnlite = EventSession | EventDevice;

/**
 * @emits 'device-created'
 */
export interface Enlite {
  /**
   * start activities
   * @returns true if opening is success
   */
  open(): Promise<boolean>;

  /**
   * end activities
   */
  close(): Promise<void>;

  /**
   * Add a listener for the event
   * @param en
   * @param listener
   * @event 'device-created'      will be issued whenever the specified class has been instantiated.
   * @event 'session-established' a PANA session is established
   * @event 'session-ending'      receive a PANA session end request
   * @event 'session-ended'       a PANA session is ended
   * @event 'session-error'       a PANA session is ended due to error
   * @event 'session-timeout'     a PANA session is ended due to timeout
   * @event 'session-108-start'   Restriction of ARIB 108 is started
   * @event 'session-108-end'     Restriction of ARIB 108 is ended
   */
  on(en: EventSession, listener: () => void): void;
  on(en: EventDevice, listener: (device: Device) => void): void;

  /**
   * Add a one-time listener for the event
   * @param en
   * @param listener
   * @event 'device-created'      will be issued whenever the specified class has been instantiated.
   * @event 'session-established' a PANA session is established
   * @event 'session-ending'      receive a PANA session end request
   * @event 'session-ended'       a PANA session is ended
   * @event 'session-error'       a PANA session is ended due to error
   * @event 'session-timeout'     a PANA session is ended due to timeout
   * @event 'session-108-start'   Restriction of ARIB 108 is started
   * @event 'session-108-end'     Restriction of ARIB 108 is ended
   */
  once(en: EventSession, listener: () => void): void;
  once(en: EventDevice, listener: (device: Device) => void): void;

  /**
   * add a user defined device class.
   * @param deviceClass
   * @param yourDevice
   * @emits 'device-created' an event 'device-created' will be issued
   * whenever the specified class has been instantiated.
   */
  addDeviceClass(deviceClass: CLASS, yourDevice: DeviceConstructor): void;

  /**
   * check activities
   * @returns true if opened.
   */
  isOpen: boolean;
}
