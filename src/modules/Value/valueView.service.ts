/**
 * 📊 Value View Service
 *
 * Provides data in formats optimized for UI display
 * - Table view: All device values grouped by timestamp with ports as columns
 * - Latest snapshot: Current reading for each port
 * - Time-series data: For charts and graphs
 * - Statistics: Min, max, avg, trends
 */

import { Value, IValue } from './Value.model';
import { Device } from '../Device/Device.model';
import mongoose from 'mongoose';

/**
 * Table View: Get all values organized by timestamp
 *
 * Response format:
 * [
 *   {
 *     ts: "2026-01-10T14:30:00Z",
 *     values: {
 *       DI_1: { rawValue: 1, calibratedValue: 1 },
 *       AI_1: { rawValue: 250, calibratedValue: -15, unit: "°C" },
 *       MI_1: {
 *         "Slave1_Read1": { rawValue: 10023, calibratedValue: 1002.3, unit: "kPa" },
 *         "Slave2_Read1": { rawValue: 2953, calibratedValue: 22.15, unit: "°C" }
 *       }
 *     }
 *   }
 * ]
 */
export const getDeviceValuesTableView = async (
  deviceId: string,
  options: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {},
) => {
  // 1. Fetch device config to know port structure
  const device = await Device.findOne({
    $or: [{ _id: deviceId }, { configId: deviceId }],
  }).lean();

  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  // 2. Build port metadata map
  const portMetadata = new Map();
  for (const port of device.ports || []) {
    portMetadata.set(port.portKey, {
      name: port.name,
      unit: port.unit,
      portType: port.portType,
      modbusSlaves: port.modbusSlaves || [],
    });
  }

  // 3. Build query
  const query: any = {
    'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
  };

  if (options.startTime || options.endTime) {
    query.ts = {};
    if (options.startTime) query.ts.$gte = options.startTime;
    if (options.endTime) query.ts.$lte = options.endTime;
  }

  // 4. Fetch values sorted by timestamp (newest first)
  const values = await Value.find(query)
    .sort({ ts: -1 })
    .limit(options.limit || 1000)
    .lean()
    .exec();

  // 5. Group values by timestamp
  const groupedByTs = new Map<string, any[]>();

  for (const value of values) {
    const tsString = new Date(value.ts).toISOString();
    if (!groupedByTs.has(tsString)) {
      groupedByTs.set(tsString, []);
    }
    groupedByTs.get(tsString)!.push(value);
  }

  // 6. Transform to table format
  const tableData = Array.from(groupedByTs.entries()).map(([ts, vals]) => {
    const rowData: any = { ts };

    // Organize values by port
    for (const val of vals) {
      const portKey = val.port.portKey;

      if (portKey.startsWith('DI_') || portKey.startsWith('AI_')) {
        // Simple port
        rowData[portKey] = {
          rawValue: val.rawValue,
          calibratedValue: val.calibratedValue,
          unit: val.unit,
          quality: val.quality,
          portType: val.port.portType,
        };
      } else if (portKey.startsWith('MI_')) {
        // Modbus port - organize by slave and read
        if (!rowData[portKey]) {
          rowData[portKey] = {};
        }

        const slaveId = val.modbusRead?.slaveId;
        const readId = val.modbusRead?.readId;
        const readName = val.modbusRead?.tag || val.modbusRead?.name || readId;

        const key = `${slaveId}_${readName}`;

        rowData[portKey][key] = {
          readId,
          slaveId,
          readName: val.modbusRead?.name,
          tag: val.modbusRead?.tag,
          rawValue: val.rawValue,
          calibratedValue: val.calibratedValue,
          unit: val.unit,
          quality: val.quality,
          registers: val.modbusRegisters,
        };
      }
    }

    return rowData;
  });

  return tableData;
};

/**
 * Latest Snapshot: Get the most recent value for each port/read
 *
 * Perfect for dashboard showing current status
 *
 * Response format:
 * {
 *   timestamp: "2026-01-10T14:35:00Z",
 *   ports: {
 *     DI_1: { value: 1, unit: null, timestamp: "..." },
 *     AI_1: { value: -15, unit: "°C", timestamp: "..." },
 *     MI_1: {
 *       "Slave1": {
 *         "Read1": { value: 1002.3, unit: "kPa", timestamp: "..." }
 *       }
 *     }
 *   }
 * }
 */
export const getDeviceLatestSnapshot = async (deviceId: string) => {
  // 1. Fetch device config
  const device = await Device.findOne({
    $or: [{ _id: deviceId }, { configId: deviceId }],
  }).lean();

  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  // 2. Get latest value for each port + read combination
  const latestValues = await Value.aggregate([
    {
      $match: {
        'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
      },
    },
    {
      $sort: { ts: -1 },
    },
    {
      $group: {
        _id: {
          portKey: '$port.portKey',
          readId: '$modbusRead.readId', // null for DI/AI
        },
        lastValue: { $first: '$$ROOT' },
      },
    },
  ]);

  // 3. Get the absolute latest timestamp across all values
  const allValues = await Value.findOne(
    { 'metadata.deviceId': new mongoose.Types.ObjectId(deviceId) },
    {},
    { sort: { ts: -1 } },
  ).lean();

  const latestTs = allValues?.ts || new Date();

  // 4. Organize data
  const snapshot: any = {
    timestamp: latestTs,
    ports: {},
  };

  for (const item of latestValues) {
    const portKey = item._id.portKey;
    const val = item.lastValue;

    if (portKey.startsWith('DI_') || portKey.startsWith('AI_')) {
      snapshot.ports[portKey] = {
        name: val.port ? val.port.portKey : portKey,
        value: val.calibratedValue,
        rawValue: val.rawValue,
        unit: val.unit || null,
        timestamp: val.ts,
        quality: val.quality,
      };
    } else if (portKey.startsWith('MI_')) {
      if (!snapshot.ports[portKey]) {
        snapshot.ports[portKey] = {};
      }

      const slaveId = val.modbusRead?.slaveId;
      const readName = val.modbusRead?.tag || val.modbusRead?.name;

      if (!snapshot.ports[portKey][slaveId]) {
        snapshot.ports[portKey][slaveId] = {};
      }

      snapshot.ports[portKey][slaveId][readName] = {
        readId: val.modbusRead?.readId,
        name: val.modbusRead?.name,
        tag: val.modbusRead?.tag,
        value: val.calibratedValue,
        rawValue: val.rawValue,
        unit: val.unit || null,
        timestamp: val.ts,
        quality: val.quality,
        registers: val.modbusRegisters,
      };
    }
  }

  return snapshot;
};

/**
 * Time-Series Data: Get values for a specific port over time
 *
 * Perfect for line charts, area charts
 *
 * Response format:
 * {
 *   portKey: "AI_1",
 *   name: "Temperature Sensor",
 *   unit: "°C",
 *   dataPoints: [
 *     { ts: "2026-01-10T14:30:00Z", value: -15, rawValue: 250 },
 *     { ts: "2026-01-10T14:31:00Z", value: -14.5, rawValue: 255 }
 *   ],
 *   stats: { min, max, avg, count }
 * }
 */
export const getPortTimeSeriesData = async (
  deviceId: string,
  portKey: string,
  options: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {},
) => {
  // 1. Fetch device config for port details
  const device = await Device.findOne(
    { $or: [{ _id: deviceId }, { configId: deviceId }] },
    { ports: 1 },
  )
    .select('ports')
    .lean();

  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  const port = device.ports?.find((p: any) => p.portKey === portKey);

  // 2. Build query
  const query: any = {
    'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
    'port.portKey': portKey,
  };

  if (options.startTime || options.endTime) {
    query.ts = {};
    if (options.startTime) query.ts.$gte = options.startTime;
    if (options.endTime) query.ts.$lte = options.endTime;
  }

  // 3. Fetch values
  const values = await Value.find(query)
    .select('ts calibratedValue rawValue quality')
    .sort({ ts: 1 })
    .limit(options.limit || 10000)
    .lean()
    .exec();

  // 4. Calculate statistics
  const calibratedValues = values.map((v) => v.calibratedValue as number).filter((v) => !isNaN(v));

  const stats = {
    count: values.length,
    minValue: Math.min(...calibratedValues),
    maxValue: Math.max(...calibratedValues),
    avgValue:
      calibratedValues.length > 0
        ? calibratedValues.reduce((a, b) => a + b, 0) / calibratedValues.length
        : 0,
    firstTimestamp: values[0]?.ts,
    lastTimestamp: values[values.length - 1]?.ts,
  };

  // 5. Format response
  return {
    portKey,
    name: port?.name || portKey,
    unit: port?.unit || null,
    dataPoints: values.map((v) => ({
      ts: v.ts,
      value: v.calibratedValue,
      rawValue: v.rawValue,
      quality: v.quality,
    })),
    stats,
  };
};

/**
 * Modbus Read Time-Series: Get values for a specific modbus read over time
 *
 * Similar to getPortTimeSeriesData but for modbus reads
 */
export const getModbusReadTimeSeriesData = async (
  deviceId: string,
  readId: string,
  options: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {},
) => {
  // 1. Build query
  const query: any = {
    'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
    'modbusRead.readId': readId,
  };

  if (options.startTime || options.endTime) {
    query.ts = {};
    if (options.startTime) query.ts.$gte = options.startTime;
    if (options.endTime) query.ts.$lte = options.endTime;
  }

  // 2. Fetch values
  const values = await Value.find(query)
    .select('ts calibratedValue rawValue unit modbusRead quality modbusRegisters')
    .sort({ ts: 1 })
    .limit(options.limit || 10000)
    .lean()
    .exec();

  if (values.length === 0) {
    throw new Error(`No data found for read: ${readId}`);
  }

  // 3. Get read details from first value
  const readDetails = values[0].modbusRead;

  // 4. Calculate statistics
  const calibratedValues = values.map((v) => v.calibratedValue as number).filter((v) => !isNaN(v));

  const stats = {
    count: values.length,
    minValue: Math.min(...calibratedValues),
    maxValue: Math.max(...calibratedValues),
    avgValue:
      calibratedValues.length > 0
        ? calibratedValues.reduce((a, b) => a + b, 0) / calibratedValues.length
        : 0,
    firstTimestamp: values[0]?.ts,
    lastTimestamp: values[values.length - 1]?.ts,
  };

  // 5. Format response
  return {
    readId,
    name: readDetails?.name,
    tag: readDetails?.tag,
    unit: values[0]?.unit || null,
    dataPoints: values.map((v) => ({
      ts: v.ts,
      value: v.calibratedValue,
      rawValue: v.rawValue,
      quality: v.quality,
      registers: v.modbusRegisters,
    })),
    stats,
  };
};

/**
 * Device Status Summary: Quick overview of all ports
 *
 * Perfect for device status page
 *
 * Response format:
 * {
 *   deviceId: "...",
 *   deviceName: "Monitor Unit 1",
 *   lastUpdate: "2026-01-10T14:35:00Z",
 *   portCount: 5,
 *   portStatus: {
 *     DI_1: { name: "...", value: 1, unit: null, status: "good" },
 *     AI_1: { name: "...", value: -15, unit: "°C", status: "good" },
 *     MI_1: { name: "...", readCount: 2, status: "good" }
 *   }
 * }
 */
export const getDeviceStatusSummary = async (deviceId: string) => {
  // 1. Fetch device
  const device = await Device.findOne({
    $or: [{ _id: deviceId }, { configId: deviceId }],
  }).lean();

  if (!device) {
    throw new Error(`Device not found: ${deviceId}`);
  }

  // 2. Get latest values for each port
  const latestValues = await Value.aggregate([
    {
      $match: {
        'metadata.deviceId': new mongoose.Types.ObjectId(deviceId),
      },
    },
    {
      $sort: { ts: -1 },
    },
    {
      $group: {
        _id: '$port.portKey',
        lastValue: { $first: '$$ROOT' },
      },
    },
  ]);

  // 3. Build status for each port
  const portStatus: any = {};

  for (const port of device.ports || []) {
    const portKey = port.portKey;
    const lastValue = latestValues.find((v) => v._id === portKey);

    if (portKey.startsWith('DI_') || portKey.startsWith('AI_')) {
      portStatus[portKey] = {
        name: port.name,
        value: lastValue?.lastValue?.calibratedValue ?? null,
        unit: port.unit || null,
        lastUpdate: lastValue?.lastValue?.ts || null,
        quality: lastValue?.lastValue?.quality || 'unknown',
      };
    } else if (portKey.startsWith('MI_')) {
      // Count reads across all slaves
      const readCount =
        port.modbusSlaves?.reduce((acc, slave) => acc + (slave.reads?.length || 0), 0) || 0;

      portStatus[portKey] = {
        name: port.name,
        readCount,
        slaveCount: port.modbusSlaves?.length || 0,
        lastUpdate:
          latestValues
            .filter((v) => v.lastValue?.port?.portKey === portKey)
            .map((v) => v.lastValue?.ts)
            .sort()
            .pop() || null,
        quality: 'unknown',
      };
    }
  }

  // 4. Get overall last update
  const lastUpdate = latestValues
    .map((v) => v.lastValue?.ts)
    .filter(Boolean)
    .sort()
    .pop();

  return {
    deviceId: device._id,
    deviceName: device.name,
    lastUpdate: lastUpdate || null,
    portCount: device.ports?.length || 0,
    portStatus,
  };
};

/**
 * Export data for a device (CSV ready)
 *
 * Returns data in format ready for CSV export
 */
export const getDeviceValuesExport = async (
  deviceId: string,
  options: {
    startTime?: Date;
    endTime?: Date;
  } = {},
) => {
  // 1. Get table view data
  const tableData = await getDeviceValuesTableView(deviceId, {
    ...options,
    limit: 100000, // Large limit for export
  });

  // 2. Flatten for CSV
  const flatData = tableData.map((row) => {
    const flatRow: any = { timestamp: row.ts };

    for (const [key, value] of Object.entries(row)) {
      if (key === 'ts') continue;

      if (typeof value === 'object' && value !== null) {
        // Handle both simple ports and modbus ports
        if (key.startsWith('MI_')) {
          // Modbus port
          for (const [slave, slaveData] of Object.entries(value as any)) {
            for (const [read, readData] of Object.entries(slaveData as any)) {
              const rd = readData as any;
              flatRow[`${key}_${slave}_${read}_value`] = rd.calibratedValue;
              flatRow[`${key}_${slave}_${read}_unit`] = rd.unit;
            }
          }
        } else {
          // Simple port
          const v = value as any;
          flatRow[`${key}_value`] = v.calibratedValue;
          flatRow[`${key}_unit`] = v.unit;
        }
      }
    }

    return flatRow;
  });

  return flatData;
};
