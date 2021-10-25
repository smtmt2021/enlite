/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Frame } from './frame';
import { ESV } from './esv';
import { CLASS } from './device-class';
import DEBUG from 'debug';
const debug = DEBUG('enlite/node');

export abstract class Node {
  private active = false;
  protected tid = 0;
  get id(): number {
    return this.deviceClass * 0x100 + this.instanceCode;
  }

  get isOpen(): boolean {
    return this.active;
  }

  constructor(
    protected readonly deviceClass: CLASS,
    protected readonly instanceCode = 1
  ) {
    if (instanceCode < 1 || instanceCode > 0xff) {
      throw new Error('enlite: invalid instance code');
    }
    debug('node.created', this.constructor.name);
  }

  open(): Promise<boolean> {
    debug('node.open', this.constructor.name);
    if (this.active) {
      console.info(`enlite: ${this.constructor.name} is already opened`);
      return Promise.resolve(false);
    }
    this.active = true;
    return Promise.resolve(true);
  }

  close(): Promise<boolean> {
    debug('node.close', this.constructor.name);
    if (!this.active) {
      console.info(`enlite: ${this.constructor.name} is not opened`);
      return Promise.resolve(false);
    }
    this.active = false;
    return Promise.resolve(true);
  }

  protected getNextTid(): number {
    this.tid += 1;
    this.tid &= 0xffff;
    return this.tid;
  }

  protected onGetRes(address: string, frame: Frame): Promise<void> {
    debug('node.onGetRes', address, frame.toString());
    return Promise.resolve();
  }

  protected onInf(address: string, frame: Frame): Promise<void> {
    debug('node.onInf', address, frame.toString());
    return Promise.resolve();
  }

  protected onInfC(address: string, frame: Frame): Promise<void> {
    debug('node.onInfC', address, frame.toString());
    return Promise.resolve();
  }

  onData(address: string, frame: Frame): Promise<void> {
    if (!this.isOpen) {
      return Promise.resolve();
    }
    switch (frame.esv) {
      case ESV.GET_RES:
        return this.onGetRes(address, frame);
      case ESV.INF:
        return this.onInf(address, frame);
      case ESV.INFC:
        return this.onInfC(address, frame);
    }
    debug(`node.onData: unknown esv, ${frame.toString()}`);
    return Promise.resolve();
  }
}
