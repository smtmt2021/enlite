/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EventEmitter } from 'events';
import { WsunGetAdaptor, WsunSocket, WsunAdaptor } from '@smtmt2021/wsun-adaptor';
import { Enlite, EventSession, EventDevice, EventEnlite } from './enlite';
import { EnliteConfig, EnliteLocal, DeviceConstructor } from './interfaces';
import { getEnliteConfig, updateWsunCache } from './enlite-config';
import { NodeProfile } from './nodeprofile';
import { Controller } from './controller';
import { Device } from './device';
import { CLASS } from './device-class';
import DEBUG from 'debug';
const debug = DEBUG('enlite/enlite');

export type EnliteSocket = WsunSocket;

type RepositoryItem = { [key in CLASS] : DeviceConstructor };

export class EnliteImpl implements Enlite, EnliteLocal {
  private static instance: Enlite;
  private static config: EnliteConfig;

  static getInstance(): Enlite {
    debug('enlite: getInstance');
    if (!EnliteImpl.instance) {
      EnliteImpl.config = getEnliteConfig();
      EnliteImpl.instance = new EnliteImpl();
    }
    return EnliteImpl.instance;
  }

  private event = new EventEmitter();
  private adaptor: WsunAdaptor;
  private nodeprofile: NodeProfile;
  private controller?: Controller;
  private repository: RepositoryItem = {} as RepositoryItem;

  private constructor() {
    const adaptor = WsunGetAdaptor(EnliteImpl.config.wsun.adaptor, EnliteImpl.config.wsun.config);
    if (!adaptor) {
      throw new Error(`enlite: cannot get an adaptor for ${EnliteImpl.config.wsun.adaptor}`);
    }
    this.adaptor = adaptor;
    this.nodeprofile = new NodeProfile(this);
    debug('enlite: constructed');
  }

  get isOpen(): boolean {
    return !!this.controller;
  }

  async open(): Promise<boolean> {
    debug('enlite: open');
    if (this.isOpen) {
      console.info('enlite: already opened');
      return true;
    }
    this.adaptor.on('session-established', () => this.event.emit('session-established'));
    this.adaptor.on('session-ending', () => this.event.emit('session-ending'));
    this.adaptor.on('session-ended', () => this.event.emit('session-ended'));
    this.adaptor.on('session-error', () => this.event.emit('session-error'));
    this.adaptor.on('session-timeout', () => this.event.emit('session-timeout'));
    this.adaptor.on('session-108-start', () => this.event.emit('session-108-start'));
    this.adaptor.on('session-108-end', () => this.event.emit('session-108-end'));
    const descriptor = await this.adaptor.open(EnliteImpl.config.wsun.id, EnliteImpl.config.wsun.cache);
    if (!descriptor) {
      console.info('enlite: opening enlite is failed');
      return false;
    }
    await updateWsunCache(descriptor);
    this.controller = new Controller(this.nodeprofile);
    await this.nodeprofile.open(this.controller);
    console.log('enlite: opened successfully');
    return true;
  }

  async close(): Promise<void> {
    debug('enlite: close');
    if (!this.isOpen) {
      console.info('enlite: not opened');
      return;
    }
    this.event.removeAllListeners();
    await this.nodeprofile.close();
    this.controller = undefined;
    await this.adaptor.close();
    console.log('enlite: closed successfully');
  }

  on(en: EventSession, listener: () => void): void;
  on(en: EventDevice, listener: (device: Device) => void): void ;
  on(en: EventEnlite, listener: (device: Device) => void): void {
    this.event.on(en, listener);
  }

  once(en: EventSession, listener: () => void): void;
  once(en: EventDevice, listener: (device: Device) => void): void;
  once(en: EventEnlite, listener: (device: Device) => void): void {
    this.event.once(en, listener);
  }

  addDeviceClass(deviceClass: CLASS, yourDevice: DeviceConstructor): void {
    debug('enlite: addDeviceClass');
    this.repository[deviceClass] = yourDevice;
  }

  createDevice(controller: Controller, deviceClass: CLASS, address: string, instanceCode?: number): Device | undefined {
    debug('enlite: createDevice');
    const Cdevice = this.repository[deviceClass];
    if (!Cdevice) {
      console.info('enlite: no device class registered for', deviceClass);
      return;
    }
    const device = new Cdevice(controller, address, deviceClass, instanceCode);
    this.event.emit('device-created', device);
    return device;
  }

  createSocket(): EnliteSocket {
    debug('enlite: createSocket');
    return this.adaptor.createSocket();
  }
}
