import mongoose from 'mongoose';
import { Device } from '../Device/Device.model';
import {
  ILatestValuesResponse,
  IModbusPortWithLatestValues,
  IModbusReadWithLatestValue,
  IModbusSlaveWithLatestValues,
  IPortWithLatestValue,
} from './value.types';
import { Value } from './Value.model';
import { DevicePayload, transformDevicePayload } from './valueTransformation.service';

/**
 * 📊 Value Service
 *
 * Handles device value ingestion and storage
 * Validates that values come from authorized devices with valid ports/reads
 * Stores each value as a time-series document
 */

/**
 * Device payload format (raw from device - automatically transformed):
 *
 * {
 *   deviceId: 'device123',
 *   ts: "2025-01-08T10:30:00Z",  // Optional, defaults to now
 *   values: {
 *     DI_1: 0,
 *     DI_2: 1,
 *     AI_1: 23.5,
 *     AI_2: 48.7,
 *     MI_1: [
 *       {
 *         slave_id: 1,
 *         registers: [
 *           { readId: '1234dsd22', value: [23223] },
 *           { readId: '1234dsd23', value: [101, 102] },
 *           ...
 *         ]
 *       },
 *       {
 *         slave_id: 2,
 *         registers: [...]
 *       }
 *     ]
 *   }
 * }
 *
 * Service will:
 * 1. Apply port calibration to DI/AI values
 * 2. Transform modbus registers (parse, apply endianness, scaling/offset)
 * 3. Store as individual Value documents
 */
interface DeviceValueSubmissionDto {
  deviceId: string;
  ts?: Date;
  values: {
    [portKey: string]: any; // DI_1, AI_1, MI_1, etc.
  };
}

/**
 * Store values from device with automatic transformation
 *
 * This function accepts the raw device payload format with:
 * - Digital/Analog values (DI_*, AI_*)
 * - Modbus register arrays (MI_*)
 *
 * Automatically:
 * 1. Fetches device config and orgId from database
 * 2. Applies port calibration to analog values
 * 3. Parses modbus registers (handles bitsToRead, endianness)
 * 4. Applies read-level and port-level calibration
 * 5. Stores as individual Value documents (one per reading)
 */
export const storeDeviceValues = async (deviceId: string, payload: DeviceValueSubmissionDto) => {
  try {
    // Transform raw device payload into Value documents
    // orgId is retrieved from device.organizationId in the transformation service
    const transformedPayload: DevicePayload = {
      deviceId: payload.deviceId,
      ts: payload.ts,
      values: payload.values,
    };

    const valueDocs = await transformDevicePayload(transformedPayload);

    if (valueDocs.length === 0) {
      return {
        success: true,
        count: 0,
        message: 'No valid values found in payload',
      };
    }

    // Insert all transformed values
    const created = await Value.insertMany(valueDocs);
    return {
      success: true,
      count: created.length,
      message: `Successfully transformed and stored ${created.length} value(s)`,
    };
  } catch (err: any) {
    throw new Error(`Failed to store values: ${err.message}`);
  }
};

/**
 * Query values for a device
 *
 * Examples:
 * - Get all values for a device in last 24 hours
 * - Get values for specific port over time range
 * - Get modbus read values with specific slaveId
 */
export const getDeviceValues = async (
  deviceId: string,
  options: {
    portKey?: string;
    readId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {},
) => {
  const query: any = {
    'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
  };

  // Add optional filters
  if (options.portKey) {
    query['port.portKey'] = options.portKey;
  }

  if (options.readId) {
    query['modbusRead.readId'] = options.readId;
  }

  if (options.startTime || options.endTime) {
    query.ts = {};
    if (options.startTime) query.ts.$gte = options.startTime;
    if (options.endTime) query.ts.$lte = options.endTime;
  }

  const limit = options.limit || 1000;

  return Value.find(query).sort({ ts: -1 }).limit(limit).lean().exec();
};

/**
 * Get values for a specific modbus read
 */
export const getModbusReadValues = async (
  deviceId: string,
  readId: string,
  options: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {},
) => {
  return getDeviceValues(deviceId, {
    readId,
    ...options,
  });
};

/**
 * Get values for a specific port
 */
export const getPortValues = async (
  deviceId: string,
  portKey: string,
  options: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {},
) => {
  return getDeviceValues(deviceId, {
    portKey,
    ...options,
  });
};

/**
 * Get latest value for each port of a device with complete port details
 *
 * Returns:
 * - Device information (name, status, etc.)
 * - For each port: raw value, calibrated value, unit, name, description, status
 * - For Modbus ports: returns latest value for each read (not just one per port)
 * - All IDs (portKey, readId, slaveId), timestamps, and quality indicators
 */

export const getLatestValues = async (
  deviceId: string,
): Promise<ILatestValuesResponse | { success: false; message: string; data: [] }> => {
  const device = await Device.findById(deviceId).lean().exec();

  if (!device) {
    return {
      success: false,
      message: 'Device not found',
      data: [],
    };
  }

  /* -------------------- Get latest values -------------------- */

  const latestValues = await Value.aggregate([
    {
      $match: {
        'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
      },
    },
    { $sort: { ts: -1 } },
    {
      $group: {
        _id: {
          portKey: '$port.portKey',
          readId: '$modbusRead.readId',
        },
        doc: { $first: '$$ROOT' },
      },
    },
  ]);

  const valueMap = new Map<string, any>();

  for (const item of latestValues) {
    const key = item.doc.modbusRead?.readId
      ? `${item.doc.port.portKey}:${item.doc.modbusRead.readId}`
      : item.doc.port.portKey;

    valueMap.set(key, item.doc);
  }

  /* -------------------- Build ports -------------------- */

  const ports = device.ports.map<IPortWithLatestValue | IModbusPortWithLatestValues>(
    (port: any) => {
      /* ---------- MODBUS PORT ---------- */
      if (port.modbusSlaves?.length) {
        const slaves: IModbusSlaveWithLatestValues[] = port.modbusSlaves.map((slave: any) => {
          const reads: IModbusReadWithLatestValue[] =
            slave.reads?.map((read: any) => {
              const key = `${port.portKey}:${read.readId}`;
              const value = valueMap.get(key);

              return {
                ...read,
                rawValue: value?.rawValue ?? null,
                calibratedValue: value?.calibratedValue ?? null,
                parsedValue: value?.modbusRegisters?.parsedValue ?? null,
                rawRegisters: value?.modbusRegisters?.rawRegisters ?? null,
                quality: value?.quality ?? 'uncertain',
                timestamp: value?.ts ?? null,
                ingestTimestamp: value?.ingestTs ?? null,
              };
            }) ?? [];

          return {
            slaveId: slave.slaveId,
            name: slave.name,
            polling: slave.polling,
            serial: slave.serial,
            reads,
          };
        });

        return {
          portKey: port.portKey,
          portType: 'MODBUS',
          name: port.name,
          unit: port.unit,
          status: port.status,
          calibration: port.calibrationValue,
          thresholds: port.thresholds,
          slaves,
        };
      }

      /* ---------- NON-MODBUS PORT ---------- */
      const value = valueMap.get(port.portKey);

      return {
        portKey: port.portKey,
        portType: port.portType,
        name: port.name,
        unit: port.unit,
        status: port.status,
        calibration: port.calibrationValue,
        thresholds: port.thresholds,

        rawValue: value?.rawValue ?? null,
        calibratedValue: value?.calibratedValue ?? null,
        quality: value?.quality ?? 'uncertain',
        timestamp: value?.ts ?? null,
        ingestTimestamp: value?.ingestTs ?? null,
      };
    },
  );

  /* -------------------- Final Response -------------------- */

  return {
    success: true,
    device: {
      id: device._id.toString(),
      name: device.name,
      status: device.status,
    },
    count: ports.length,
    ports,
  };
};

/**
 * Delete old values (data retention/cleanup)
 *
 * Example: Delete values older than 90 days
 */
export const deleteOldValues = async (beforeDate: Date) => {
  const result = await Value.deleteMany({
    ts: { $lt: beforeDate },
  });

  return {
    deletedCount: result.deletedCount,
    message: `Deleted ${result.deletedCount} old value(s)`,
  };
};

/**
 * Get value statistics for a device port
 */
export const getPortValueStats = async (
  deviceId: string,
  portKey: string,
  timeRange: {
    startTime: Date;
    endTime: Date;
  },
) => {
  const stats = await Value.aggregate([
    {
      $match: {
        'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
        'port.portKey': portKey,
        ts: {
          $gte: timeRange.startTime,
          $lte: timeRange.endTime,
        },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        minValue: { $min: '$calibratedValue' },
        maxValue: { $max: '$calibratedValue' },
        avgValue: { $avg: '$calibratedValue' },
        lastValue: { $last: '$calibratedValue' },
        lastTimestamp: { $max: '$ts' },
      },
    },
  ]);

  return stats[0] || null;
};
