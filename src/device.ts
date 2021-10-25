/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import promiseRetry from 'promise-retry';
import { WsunUdpTransmissionFailed } from '@smtmt2021/wsun-adaptor';
import { EventEmitter } from 'events';
import { Frame } from './frame';
import { Node } from './node';
import { Property } from './property';
import { SendToRemote } from './interfaces';
import { TIMEOUT_GET } from './constants';
import { CLASS } from './device-class';
import { ESV } from './esv';
import { EPC } from './epc';
import DEBUG from 'debug';
const debug = DEBUG('enlite/device');

export class GetResTimeout extends Error {
  constructor() {
    super('GetRes timeout');
    this.name = new.target.name;
  }
}

export abstract class Device extends Node {
  private event = new EventEmitter();

  constructor(
    protected controller: SendToRemote,
    public readonly address: string,
    deviceClass: CLASS,
    instanceCode = 1
  ) {
    super(deviceClass, instanceCode);
    debug('device: created', this.constructor.name);
  }

  async getValue(epc: EPC, byteLength: number): Promise<number | undefined> {
    debug('device.getValue');
    try {
      const requests = [new Property(epc)];
      const responce = await this.Get(requests);
      for (const property of responce) {
        if (property.epc === epc && property.edt?.length === byteLength) {
          return property.edt.readIntBE(0, byteLength);
        }
      }
    } catch (err) {
      console.error('device', err);
      throw err;
    }
  }

  protected Get(properties: Property[]): Promise<Property[]> {
    debug('device.Get');
    return promiseRetry((retry, count) =>
      this.getProperties(properties).catch(err => {
        if (err instanceof GetResTimeout || err instanceof WsunUdpTransmissionFailed) {
          console.info('enlite: Get(properties): retry', count);
          return retry(err);
        }
        throw err;
      }),
    {
      retries: 3,
      factor: 1
    });
  }

  protected getProperties(properties: Property[]): Promise<Property[]> {
    debug('device.getProperties');
    let timer: NodeJS.Timer;
    return new Promise<Property[]>((resolve, reject) => {
      this.event.once('getres', properties => resolve(properties));
      timer = setTimeout(() => reject(new GetResTimeout()), TIMEOUT_GET);
      this.controller.send({
        tid: this.getNextTid(),
        deoj: this.id,
        esv: ESV.GET,
        properties
      }, this.address).catch(err => reject(err));
    })
      .catch(err => {
        console.info('enlite: failed to get properties,', err);
        return Promise.reject(err);
      })
      .finally(() => {
        if (timer) {
          clearTimeout(timer);
        }
        this.event.removeAllListeners('getres');
      });
  }

  protected onGetRes(address: string, frame: Frame): Promise<void> {
    debug('device.onGetRes', frame.toString());
    if (this.tid !== frame.tid) {
      console.info('device.onGetRes: unexpected tid received', this.tid, frame.tid);
    } else {
      debug('device.onGetRes', frame.properties);
      this.event.emit('getres', frame.properties);
    }
    return Promise.resolve();
  }

  protected onInfC(address: string, frame: Frame): Promise<void> {
    debug('device.onInfC');
    console.info('enlite.onInfC:', frame.toString());
    const confirmed = Frame.confirmed(frame);
    return this.controller.send(confirmed, address);
  }
}
