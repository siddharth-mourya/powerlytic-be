import { ILocation, IModbusRead, IPort } from '../Device/Device.types';

// 🔹 Latest Value Data Interface
export interface IPortValueData {
  rawValue: number | boolean | string | null;
  calibratedValue: number | boolean | string | null;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: Date | null;
  ingestTimestamp: Date | null;
}

// 🔹 Modbus Read with Latest Value
export interface IModbusReadWithValue extends IModbusRead {
  slaveName: string;
  // Value data
  rawValue: number | boolean | string | null;
  calibratedValue: number | boolean | string | null;
  parsedValue?: number | null;
  rawRegisters?: string[] | null;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: Date | null;
  ingestTimestamp: Date | null;
}

// 🔹 Port with Latest Value (for non-Modbus ports)
export interface IPortWithValue extends Omit<IPort, 'modbusSlaves'> {
  rawValue: number | boolean | string | null;
  calibratedValue: number | boolean | string | null;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: Date | null;
  ingestTimestamp: Date | null;
}

// 🔹 Modbus Port with Latest Values (for each read)
export interface IModbusPortWithValues extends Omit<IPort, 'modbusSlaves'> {
  reads: IModbusReadWithValue[];
}

// 🔹 Device Info with Latest Values
export interface IDeviceWithLatestValues {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
}

// 🔹 Latest Values Response (for both frontend and backend)
export interface ILatestValuesResponse {
  success: boolean;
  device: IDeviceWithLatestValues;
  count: number;
  ports: (IPortWithValue | IModbusPortWithValues)[];
}

// 🔹 API Response wrapper for latest values
export interface ILatestValuesApiResponse {
  success: boolean;
  data: ILatestValuesResponse;
}
