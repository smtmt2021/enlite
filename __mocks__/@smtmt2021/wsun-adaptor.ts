/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EventEmitter } from 'events';
import { RemoteInfo } from 'dgram';
export interface WsunCache {
  channel: number;
  panId: number;
  addr: string;
}

export interface WsunPanDesc extends WsunCache {
  page?: number;
  pairId?: string;
  LQI?: number;
}

export interface WsunId {
  id: string;
  password: string;
  cache?: WsunCache; // cache of PAN descriptor
}

export interface WsunSocket {
  bind(port: number): Promise<void>;
  close(): Promise<void>;
  send(msg: Buffer | string, port: number, address: string): Promise<void>;
  on(event: 'message', listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;
  once(event: 'message', listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;
  removeListener(event: 'message', listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;
  removeAllListeners(event: 'message'): this;
}

export interface WsunConfig {
  device: string; // device name of serial port which is connected with wisun adaptor
}

export abstract class WsunAdaptor extends EventEmitter {
  abstract open(wsunId: WsunId): Promise<WsunPanDesc | undefined>;
  abstract close(): Promise<void>;
  abstract isOnline(): boolean;
  abstract createSocket(): WsunSocket;
  abstract deleteSocket(socket: WsunSocket): void;
  abstract sendDgram(msg: Buffer, port: number, address: string): Promise<void>;
}

export class SocketTest extends EventEmitter implements WsunSocket {
  bind = jest.fn((port: number) => Promise.resolve());
  send = jest.fn((msg: Buffer, port: number, address: string) => Promise.resolve());
  close = jest.fn(() => Promise.resolve());
}

export class WsunAdaptorTest extends WsunAdaptor {
  constructor(public config: WsunConfig) {
    super();
  }

  online = false;
  socket?: SocketTest;
  descriptor?: WsunPanDesc;

  open = jest.fn((wsunId: WsunId) => Promise.resolve(this.descriptor));
  close = jest.fn(() => Promise.resolve());
  isOnline = jest.fn(() => this.online);
  createSocket = jest.fn(() => this.socket = new SocketTest());
  deleteSocket = jest.fn((socket: WsunSocket) => Promise.resolve());
  sendDgram = jest.fn((msg: Buffer, port: number, address: string) => Promise.resolve());
}

type NameOfClass = 'MOCK';
export let instance: WsunAdaptorTest;

/**
 *  Class factory to get a wisun adaptor
 *  @param  className is model name of adaptor you want
 *  @param  config
 *  @return an instance of adaptor which is specified by the model name
 */
export function WsunGetAdaptor(className: NameOfClass, config?: WsunConfig): WsunAdaptor | undefined {
  if (!instance && config) {
    switch (className) {
      case 'MOCK':
        instance = new WsunAdaptorTest(config);
        break;
    }
  }
  return instance;
}
