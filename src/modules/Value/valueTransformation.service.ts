/**
 * 🔄 Value Transformation Service
 *
 * Transforms raw device payload into database-ready Value documents
 *
 * Handles:
 * 1. Digital/Analog port values - apply port calibration (scaling, offset)
 * 2. Modbus values - parse registers, apply endianness, then calibration
 * 3. Validation against device configuration
 */

import { IValue } from './Value.model';
import { Device } from '../Device/Device.model';
import mongoose from 'mongoose';
import {
  transformModbusRead,
  transformModbusSlaveReads,
  buildReadConfigMap,
  ModbusReadConfig,
} from '../../utils/transformers/modbusTransformer';

/**
 * Device payload format from physical device:
 *
 * {
 *   deviceId: 'device123',
 *   values: {
 *     DI_1: 0,
 *     DI_2: 1,
 *     AI_1: 23.5,
 *     AI_2: 48.7,
 *     AI_3: 1023,
 *     MI_1: [
 *       {
 *         slave_id: 1,
 *         registers: [
 *           { readId: '1234dsd22', value: [23223] },
 *           { readId: '1234dsd23', value: [101, 102] },
 *           ...
 *         ]
 *       }
 *     ]
 *   }
 * }
 */

interface DevicePayload {
  deviceId: string;
  ts?: Date; // Optional timestamp (defaults to now)
  values: {
    [portKey: string]: any; // DI_1, AI_1, MI_1, etc.
  };
}

interface ModbusSlaveData {
  slave_id: string | number;
  registers: Array<{
    readId: string;
    value: number[];
  }>;
}

/**
 * Transform device payload into Value documents
 *
 * 1. Validates device exists and has proper configuration
 * 2. Gets orgId from device's organizationId field (no need to pass in payload)
 * 3. For each port value:
 *    - DI/AI: Apply port calibration
 *    - MI: Parse registers, apply endianness, then apply read calibration
 * 4. Returns array of Value documents ready to insert
 */
export async function transformDevicePayload(
  payload: DevicePayload,
): Promise<Array<Partial<IValue>>> {
  // 1. Validate and fetch device with all port configurations
  const device = await Device.findOne({
    $or: [{ _id: payload.deviceId }, { configId: payload.deviceId }],
  })
    .populate('ports.portType')
    .populate('deviceModelId');

  if (!device) {
    throw new Error(`Device not found: ${payload.deviceId}`);
  }

  // Get orgId from device schema (not from payload)
  const orgId = device.organizationId?.toString();
  if (!orgId) {
    throw new Error('Device does not have an organization assigned');
  }

  // 2. Build lookup maps for quick access
  const portMap = new Map(device.ports.map((p) => [p.portKey, p]));
  const readConfigMap = buildReadConfigMap(device);

  // 3. Measurement timestamp
  const ts = payload.ts ? new Date(payload.ts) : new Date();
  const ingestTs = new Date();

  // 4. Transform each value
  const valueDocs: Array<Partial<IValue>> = [];

  for (const [portKey, rawValue] of Object.entries(payload.values)) {
    // Skip null/undefined values
    if (rawValue === null || rawValue === undefined) {
      continue;
    }

    // Validate port exists
    const port = portMap.get(portKey);
    if (!port) {
      console.warn(`Port not found in device config: ${portKey}, skipping`);
      continue;
    }

    // Get calibration config for this port
    const calibration = port.calibrationValue || { scaling: 1, offset: 0 };

    try {
      // Handle different port types
      if (portKey.startsWith('DI_') || portKey.startsWith('AI_')) {
        // Digital or Analog value
        const valueDoc = transformDigitalAnalogValue(
          portKey,
          rawValue,
          port,
          calibration,
          ts,
          ingestTs,
          device._id,
          orgId,
        );
        valueDocs.push(valueDoc);
      } else if (portKey.startsWith('MI_')) {
        // Modbus values
        const modbusValues = transformModbusValues(
          rawValue, // Array of slave data
          portKey,
          port,
          readConfigMap,
          calibration,
          ts,
          ingestTs,
          device._id,
          orgId,
        );
        valueDocs.push(...modbusValues);
      }
    } catch (err) {
      console.error(`Error transforming port ${portKey}:`, err);
      // Don't throw, just skip this port and continue
      continue;
    }
  }

  return valueDocs;
}

/**
 * Transform a digital or analog port value with calibration
 */
function transformDigitalAnalogValue(
  portKey: string,
  rawValue: number | boolean,
  port: any,
  calibration: { scaling: number; offset: number },
  ts: Date,
  ingestTs: Date,
  deviceId: mongoose.Types.ObjectId,
  orgId: string,
): Partial<IValue> {
  const portType = portKey.startsWith('DI_') ? 'DIGITAL' : 'ANALOG';

  // For digital values, don't apply scaling/offset
  let calibratedValue = rawValue;
  if (portType === 'ANALOG' && typeof rawValue === 'number') {
    calibratedValue = rawValue * calibration.scaling + calibration.offset;
  }

  return {
    ts,
    ingestTs,
    metadata: {
      deviceId,
      orgId: new mongoose.Types.ObjectId(orgId),
    },
    port: {
      portKey,
      portType,
    },
    rawValue,
    calibratedValue,
    unit: port.unit,
    quality: 'good',
  };
}

/**
 * Transform modbus values from device
 *
 * Input: Array of ModbusSlaveData from device MI_1 port
 * Output: Array of Value documents (one per register read)
 */
function transformModbusValues(
  slaveDataArray: ModbusSlaveData[],
  portKey: string,
  port: any,
  readConfigMap: Map<string, ModbusReadConfig>,
  portCalibration: { scaling: number; offset: number },
  ts: Date,
  ingestTs: Date,
  deviceId: mongoose.Types.ObjectId,
  orgId: string,
): Array<Partial<IValue>> {
  const valueDocs: Array<Partial<IValue>> = [];

  // Iterate through each slave
  for (const slaveData of slaveDataArray) {
    const slaveId = String(slaveData.slave_id);

    // Get this slave's configuration
    const slaveConfig = port.modbusSlaves?.find(
      (s: any) => s.slaveId === slaveId || String(s.slaveId) === slaveId,
    );

    if (!slaveConfig) {
      console.warn(`Slave ${slaveId} not found in port ${portKey} config, skipping`);
      continue;
    }

    // Transform each register read
    for (const register of slaveData.registers) {
      const readId = register.readId;
      const readConfig = readConfigMap.get(readId);

      if (!readConfig) {
        console.warn(`Read config not found for ${readId}, skipping`);
        continue;
      }

      try {
        // Transform the modbus register data
        const transformed = transformModbusRead(register.value, readConfig);

        // Apply port-level calibration on top of read-level calibration
        const finalCalibratedValue =
          transformed.calibratedValue * portCalibration.scaling + portCalibration.offset;

        // Create value document
        const valueDoc: Partial<IValue> = {
          ts,
          ingestTs,
          metadata: {
            deviceId,
            orgId: new mongoose.Types.ObjectId(orgId),
          },
          port: {
            portKey,
            portType: 'MODBUS',
          },
          modbusRead: {
            readId,
            slaveId,
            name: readConfig.name,
            tag: readConfig.tag,
          },
          modbusRegisters: {
            rawRegisters: transformed.rawRegisters,
            parsedValue: transformed.parsedValue,
            bitsToRead: readConfig.bitsToRead,
            endianness: readConfig.endianness,
          },
          rawValue: transformed.parsedValue, // Parsed register value
          calibratedValue: finalCalibratedValue, // After both transformations
          unit: readConfig.unit || port.unit,
          quality: 'good',
        };

        valueDocs.push(valueDoc);
      } catch (err) {
        console.error(`Error transforming read ${readId}:`, err);
        continue;
      }
    }
  }

  return valueDocs;
}

export { DevicePayload, ModbusSlaveData };
