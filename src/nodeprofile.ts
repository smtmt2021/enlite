/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EnliteSocket } from './enlite-impl';
import { RemoteInfo } from 'dgram';
import { Node } from './node';
import { Controller } from './controller';
import { Frame } from './frame';
import { Property } from './property';
import { FrameParams, SendToRemote, EnliteLocal } from './interfaces';
import { CLASS } from './device-class';
import { EPC } from './epc';
import { PORT_ENLITE } from './definitions';
import DEBUG from 'debug';
const debug = DEBUG('enlite/nodeprofile');

export class NodeProfile extends Node implements SendToRemote {
  private controller?: Controller;
  private socket?: EnliteSocket;

  constructor(private enlite: EnliteLocal) {
    super(CLASS.NODE_PROFILE);
    debug('nodeprofile created');
  }

  async open(controller?: Controller): Promise<boolean> {
    debug('nodeprofile.open');
    if (!controller) {
      console.info('enlite: nodeprofile.open needs a controller to open');
      return false;
    }
    if (!await super.open()) {
      return false;
    }
    if (!await controller.open()) {
      return false;
    }
    this.controller = controller;
    this.socket = this.enlite.createSocket();
    this.socket.on('message', (msg, rinfo) => this.listener(msg, rinfo));
    await this.socket.bind(PORT_ENLITE);
    return true;
  }

  async close(): Promise<boolean> {
    debug('nodeprofile.close');
    if (!this.isOpen) {
      return false;
    }
    if (this.socket) {
      await this.socket.close();
      this.socket = undefined;
    }
    if (this.controller) {
      await this.controller.close();
      this.controller = undefined;
    }
    return super.close();
  }

  onData(address: string, frame: Frame): Promise<void> {
    debug('nodeprofile.onData');
    if (!this.isOpen || !this.controller) {
      console.info('enlite: not opened');
      return Promise.resolve();
    }
    if (!frame.properties || !frame.properties.length) {
      console.info('enlite: a frame without properties received');
      return Promise.resolve();
    }
    if (frame.deoj !== this.id) {
      return this.controller.onData(address, frame);
    }
    return super.onData(address, frame);
  }

  send(params: FrameParams, address: string): Promise<void> {
    debug('nodeprofile.send');
    if (!this.isOpen) {
      console.info('enlite: not opened');
      return Promise.resolve();
    }
    if (!this.socket) {
      throw new Error('enlite: no socket to send');
    }
    const frame = Frame.create(params);
    debug(`nodeprofile.send ${frame.toString()} to ${address}`);
    return this.socket.send(frame.buffer, PORT_ENLITE, address);
  }

  protected async onInstanceListNotification(address: string, property: Property): Promise<void> {
    if (!this.isOpen || !this.controller) {
      console.info('enlite: not opened');
      return;
    }
    const edt = property.edt;
    if (!edt) {
      debug('nodeprofile.onInstanceListNotification: no edt');
      return;
    }
    const count = edt.readUInt8(0);
    if (!count) {
      debug('nodeprofile.onInstanceListNotification: no device class');
      return;
    }
    debug('nodeprofile.onInstanceListNotification');
    const instanceList = edt.subarray(1);
    let offset = 0;
    for (let i = 0; i < count; ++i) {
      const deviceClass = instanceList.readUIntBE(offset, 2);
      const instanceCode = instanceList.readUInt8(offset + 2);
      const device = this.enlite.createDevice(this.controller, deviceClass, address, instanceCode);
      if (device != null) {
        await this.controller.addDevice(device);
      }
      offset += 3;
    }
  }

  protected onInf(address: string, frame: Frame): Promise<void> {
    debug('nodeprofile.onInf');
    const properties = frame.properties;
    for (const property of properties) {
      switch (property.epc) {
        case EPC.INSTANCE_LIST_NOTIFICATION:
          return this.onInstanceListNotification(address, property);
        default:
          debug(`nodeprofile.onInf: unknown epc, ${frame.toString()}`);
      }
    }
    return Promise.resolve();
  }

  private listener(msg: Buffer, rinfo: RemoteInfo): Promise<void> {
    const frame = new Frame(msg);
    debug(`nodeprofile: ${frame.toString()} from ${rinfo.address}`);
    return this.onData(rinfo.address, frame);
  }
}
