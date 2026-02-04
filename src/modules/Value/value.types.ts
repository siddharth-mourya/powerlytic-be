// utils/latestValues.types.ts

import { IModbusRead, IPort } from '../Device/Device.types';

/* -------------------- Common -------------------- */

export type Quality = 'good' | 'bad' | 'uncertain';

export interface ILatestValueMeta {
  rawValue: number | boolean | string | null;
  calibratedValue: number | boolean | string | null;
  quality: Quality;
  timestamp: Date | null;
  ingestTimestamp: Date | null;
}

/* -------------------- Modbus -------------------- */

export interface IModbusReadWithLatestValue extends IModbusRead {
  rawValue: number | boolean | string | null;
  calibratedValue: number | boolean | string | null;
  parsedValue?: number | null;
  rawRegisters?: string[] | null;
  quality: Quality;
  timestamp: Date | null;
  ingestTimestamp: Date | null;
}

export interface IModbusSlaveWithLatestValues {
  slaveId: string;
  name: string;
  polling: any;
  serial: any;
  reads: IModbusReadWithLatestValue[];
}

export interface IModbusPortWithLatestValues extends Omit<IPort, 'modbusSlaves'> {
  portType: 'MODBUS';
  slaves: IModbusSlaveWithLatestValues[];
}

/* -------------------- Non-Modbus -------------------- */

export interface IPortWithLatestValue extends Omit<IPort, 'modbusSlaves'>, ILatestValueMeta {
  portType: 'DI' | 'DO' | 'AI' | 'AO';
}

/* -------------------- Device Response -------------------- */

export interface IDeviceWithLatestValues {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
}

export interface ILatestValuesResponse {
  success: true;
  device: IDeviceWithLatestValues;
  count: number;
  ports: (IPortWithLatestValue | IModbusPortWithLatestValues)[];
}
