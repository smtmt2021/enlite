/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { SendToRemote, FrameParams } from './interfaces';
import { Node } from './node';
import { Frame } from './frame';
import { Device } from './device';
import { CLASS } from './device-class';
import DEBUG from 'debug';
const debug = DEBUG('enlite/controller');

export class Controller extends Node implements SendToRemote {
  protected deviceList: Device[] = [];

  constructor(private nodeProfile: SendToRemote) {
    super(CLASS.CONTROLLER);
    debug('controller created');
  }

  async close(): Promise<boolean> {
    debug('controller.close');
    for (const device of this.deviceList) {
      await device.close();
    }
    this.deviceList = [];
    return super.close();
  }

  onData(address: string, frame: Frame): Promise<void> {
    debug('controller.onData', address, frame.seoj.toString(16));
    const device = this.lookup(address, frame.seoj);
    return device ? device.onData(address, frame) : Promise.resolve();
  }

  send(params: FrameParams, address: string): Promise<void> {
    debug('controller.send');
    if (!params.deoj || !params.esv) {
      throw new Error(`Controller.send: params are not enough, ${JSON.stringify(params)}`);
    }
    params.seoj = this.id;
    return this.nodeProfile.send(params, address);
  }

  addDevice(device: Device): Promise<boolean> {
    debug('controller.addDevice');
    if (this.lookup(device.address, device.id)) {
      console.info('enlite: the device is already added', device.id.toString(16), device.address);
      return Promise.resolve(false);
    }
    this.deviceList.push(device);
    return Promise.resolve(true);
  }

  private lookup(address: string, seoj: number): Device | undefined {
    debug('controller.lookup', address, seoj.toString(16));
    return this.deviceList.find(
      device => device.address === address && device.id === seoj
    );
  }
}
