/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { EnliteSocket } from './enlite-impl';
import { Controller } from './controller';
import { Device } from './device';
import { Property } from './property';
import { ESV } from './esv';
import { CLASS } from './device-class';
import { WsunConfig, WsunId, WsunCache, NameOfClass } from '@smtmt2021/wsun-adaptor';

export interface FrameParams {
   tid?: number;
   seoj?: number;
   deoj?: number;
   esv: ESV;
   properties: Property[];
 }

export interface EnliteConfig {
  wsun: {
    adaptor: NameOfClass;
    id: WsunId;
    cache: WsunCache;
    config: WsunConfig;
  }
}

export interface SendToRemote {
  send(params: FrameParams, address: string): Promise<void>;
}

export interface TimeValue {
  time: Date;
  value: number;
}

export interface CreateDevice {
  createDevice(controller: Controller, deviceClass: CLASS, address: string, instanceCode?: number): Device | undefined;
}

export interface CreateSocket {
  createSocket(): EnliteSocket;
}

export interface DeviceConstructor {
  new(controller: Controller, address: string, deviceClass: CLASS, instanceCode?: number): Device;
}

export type EnliteLocal = CreateDevice & CreateSocket;
