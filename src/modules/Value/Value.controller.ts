import { Request, Response } from 'express';
import * as valueService from './value.service';
import * as valueViewService from './valueView.service';

/**
 * 📊 Value Controller
 *
 * Handles HTTP requests for value ingestion and retrieval
 */

/**
 * POST /api/devices/:deviceId/values
 *
 * Store values from physical device with automatic transformation
 *
 * Device sends raw format:
 * ```json
 * {
 *   "deviceId": "device123",
 *   "ts": "2025-01-08T10:30:00Z",
 *   "values": {
 *     "DI_1": 0,
 *     "DI_2": 1,
 *     "AI_1": 23.5,
 *     "AI_2": 48.7,
 *     "MI_1": [
 *       {
 *         "slave_id": 1,
 *         "registers": [
 *           { "readId": "read-uuid-1", "value": [23223] },
 *           { "readId": "read-uuid-2", "value": [101, 102] },
 *           { "readId": "read-uuid-3", "value": [3001, 3002, 3003, 3004] }
 *         ]
 *       },
 *       {
 *         "slave_id": 2,
 *         "registers": [...]
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * Service automatically:
 * 1. Applies port calibration to DI/AI values (scaling, offset)
 * 2. Parses modbus registers (handles bitsToRead, endianness conversion)
 * 3. Applies read-level and port-level calibration to modbus values
 * 4. Stores as individual Value documents (one per reading)
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "count": 8,
 *     "message": "Successfully transformed and stored 8 value(s)"
 *   }
 * }
 * ```
 */
export const storeValues = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const payload = req.body; // Should include deviceId, ts (optional), values

    // Validate payload structure
    if (!payload.values || typeof payload.values !== 'object') {
      return res.status(400).json({
        error: 'Invalid payload',
        message:
          'Expected "values" object in request body with format: { DI_1: 0, AI_1: 23.5, MI_1: [...] }',
      });
    }

    // Ensure deviceId in payload matches route parameter
    if (!payload.deviceId) {
      payload.deviceId = deviceId;
    }

    // orgId is automatically retrieved from device.organizationId
    const result = await valueService.storeDeviceValues(payload.deviceId, payload);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('❌ Error storing values:', err);
    return res.status(400).json({
      error: 'Failed to store values',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values
 *
 * Query values with filters
 *
 * Query params:
 * - portKey: Filter by port (e.g., "DI_1")
 * - readId: Filter by modbus read
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - limit: Number of results (default 1000)
 *
 * Examples:
 * - GET /api/devices/device-id/values
 * - GET /api/devices/device-id/values?portKey=DI_1
 * - GET /api/devices/device-id/values?portKey=MI_1&startTime=2025-01-01T00:00:00Z
 * - GET /api/devices/device-id/values?readId=read-uuid&limit=100
 */
export const getValues = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { portKey, readId, startTime, endTime, limit } = req.query;

    const options: any = {
      limit: limit ? parseInt(limit as string) : 1000,
    };

    if (portKey) options.portKey = portKey as string;
    if (readId) options.readId = readId as string;
    if (startTime) options.startTime = new Date(startTime as string);
    if (endTime) options.endTime = new Date(endTime as string);

    const values = await valueService.getDeviceValues(deviceId, options);

    return res.status(200).json({
      success: true,
      count: values.length,
      data: values,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving values:', err);
    return res.status(400).json({
      error: 'Failed to retrieve values',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/latest
 *
 * Get latest value for each port
 */
export const getLatestValues = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const values = await valueService.getLatestValues(deviceId);

    return res.status(200).json(values);
  } catch (err: any) {
    console.error('❌ Error retrieving latest values:', err);
    return res.status(400).json({
      error: 'Failed to retrieve latest values',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/port/:portKey
 *
 * Get values for specific port with filters
 *
 * Query params:
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - limit: Number of results
 */
export const getPortValues = async (req: Request, res: Response) => {
  try {
    const { deviceId, portKey } = req.params;
    const { startTime, endTime, limit } = req.query;

    const options: any = {
      limit: limit ? parseInt(limit as string) : 1000,
    };

    if (startTime) options.startTime = new Date(startTime as string);
    if (endTime) options.endTime = new Date(endTime as string);

    const values = await valueService.getPortValues(deviceId, portKey as string, options);

    return res.status(200).json({
      success: true,
      count: values.length,
      data: values,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving port values:', err);
    return res.status(400).json({
      error: 'Failed to retrieve port values',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/modbus/:readId
 *
 * Get values for specific modbus read
 *
 * Query params:
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - limit: Number of results
 */
export const getModbusReadValues = async (req: Request, res: Response) => {
  try {
    const { deviceId, readId } = req.params;
    const { startTime, endTime, limit } = req.query;

    const options: any = {
      limit: limit ? parseInt(limit as string) : 1000,
    };

    if (startTime) options.startTime = new Date(startTime as string);
    if (endTime) options.endTime = new Date(endTime as string);

    const values = await valueService.getModbusReadValues(deviceId, readId as string, options);

    return res.status(200).json({
      success: true,
      count: values.length,
      data: values,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving modbus read values:', err);
    return res.status(400).json({
      error: 'Failed to retrieve modbus read values',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/stats/:portKey
 *
 * Get statistics for a port over time range
 *
 * Query params:
 * - startTime: ISO date string (required)
 * - endTime: ISO date string (required)
 *
 * Returns: { count, min, max, avg, lastValue, lastTimestamp }
 */
export const getPortStats = async (req: Request, res: Response) => {
  try {
    const { deviceId, portKey } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'startTime and endTime are required',
      });
    }

    const stats = await valueService.getPortValueStats(deviceId, portKey as string, {
      startTime: new Date(startTime as string),
      endTime: new Date(endTime as string),
    });

    if (!stats) {
      return res.status(404).json({
        error: 'No data found',
        message: `No values found for port ${portKey} in the specified time range`,
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving port stats:', err);
    return res.status(400).json({
      error: 'Failed to retrieve port statistics',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/table
 *
 * Get table view: All values organized by timestamp
 * Perfect for displaying in a data table
 *
 * Query params:
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - limit: Number of rows (default 1000)
 *
 * Response format:
 * [
 *   {
 *     ts: "2025-01-10T14:30:00Z",
 *     DI_1: { rawValue: 1, calibratedValue: 1 },
 *     AI_1: { rawValue: 250, calibratedValue: -15, unit: "°C" },
 *     MI_1: {
 *       "Slave1_Read1": { rawValue: 10023, calibratedValue: 1002.3, unit: "kPa" },
 *       "Slave2_Read1": { rawValue: 2953, calibratedValue: 22.15, unit: "°C" }
 *     }
 *   }
 * ]
 */
export const getTableView = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { startTime, endTime, limit } = req.query;

    const options: any = {
      limit: limit ? parseInt(limit as string) : 1000,
    };

    if (startTime) options.startTime = new Date(startTime as string);
    if (endTime) options.endTime = new Date(endTime as string);

    const data = await valueViewService.getDeviceValuesTableView(deviceId, options);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving table view:', err);
    return res.status(400).json({
      error: 'Failed to retrieve table view',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/snapshot
 *
 * Get latest snapshot: Current value for each port
 * Perfect for dashboard showing current status
 *
 * Response format:
 * {
 *   timestamp: "2025-01-10T14:35:00Z",
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
export const getLatestSnapshot = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const snapshot = await valueViewService.getDeviceLatestSnapshot(deviceId);

    return res.status(200).json({
      success: true,
      data: snapshot,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving latest snapshot:', err);
    return res.status(400).json({
      error: 'Failed to retrieve latest snapshot',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/timeseries/:portKey
 *
 * Get time-series data for a specific port
 * Perfect for line charts, area charts
 *
 * Query params:
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - limit: Max data points (default 10000)
 *
 * Response format:
 * {
 *   portKey: "AI_1",
 *   name: "Temperature Sensor",
 *   unit: "°C",
 *   dataPoints: [
 *     { ts: "2025-01-10T14:30:00Z", value: -15, rawValue: 250 },
 *     { ts: "2025-01-10T14:31:00Z", value: -14.5, rawValue: 255 }
 *   ],
 *   stats: { count, minValue, maxValue, avgValue, firstTimestamp, lastTimestamp }
 * }
 */
export const getPortTimeSeries = async (req: Request, res: Response) => {
  try {
    const { deviceId, portKey } = req.params;
    const { startTime, endTime, limit } = req.query;

    const options: any = {
      limit: limit ? parseInt(limit as string) : 10000,
    };

    if (startTime) options.startTime = new Date(startTime as string);
    if (endTime) options.endTime = new Date(endTime as string);

    const data = await valueViewService.getPortTimeSeriesData(deviceId, portKey as string, options);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving port time-series:', err);
    return res.status(400).json({
      error: 'Failed to retrieve port time-series',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/timeseries/modbus/:readId
 *
 * Get time-series data for a specific modbus read
 *
 * Query params:
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - limit: Max data points (default 10000)
 */
export const getModbusReadTimeSeries = async (req: Request, res: Response) => {
  try {
    const { deviceId, readId } = req.params;
    const { startTime, endTime, limit } = req.query;

    const options: any = {
      limit: limit ? parseInt(limit as string) : 10000,
    };

    if (startTime) options.startTime = new Date(startTime as string);
    if (endTime) options.endTime = new Date(endTime as string);

    const data = await valueViewService.getModbusReadTimeSeriesData(
      deviceId,
      readId as string,
      options,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving modbus read time-series:', err);
    return res.status(400).json({
      error: 'Failed to retrieve modbus read time-series',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/status
 *
 * Get device status summary
 * Perfect for device status page showing quick overview
 *
 * Response format:
 * {
 *   deviceId: "...",
 *   deviceName: "Monitor Unit 1",
 *   lastUpdate: "2025-01-10T14:35:00Z",
 *   portCount: 5,
 *   portStatus: {
 *     DI_1: { name: "...", value: 1, unit: null, lastUpdate: "..." },
 *     AI_1: { name: "...", value: -15, unit: "°C", lastUpdate: "..." },
 *     MI_1: { name: "...", readCount: 2, slaveCount: 1, lastUpdate: "..." }
 *   }
 * }
 */
export const getStatusSummary = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const summary = await valueViewService.getDeviceStatusSummary(deviceId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    console.error('❌ Error retrieving device status:', err);
    return res.status(400).json({
      error: 'Failed to retrieve device status',
      message: err.message,
    });
  }
};

/**
 * GET /api/devices/:deviceId/values/export
 *
 * Export values in CSV-ready format
 *
 * Query params:
 * - startTime: ISO date string
 * - endTime: ISO date string
 *
 * Returns flattened JSON array that can be easily converted to CSV
 */
export const getExportData = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { startTime, endTime } = req.query;

    const options: any = {};

    if (startTime) options.startTime = new Date(startTime as string);
    if (endTime) options.endTime = new Date(endTime as string);

    const data = await valueViewService.getDeviceValuesExport(deviceId, options);

    // Optional: Set response header for CSV download
    // res.setHeader('Content-Type', 'text/csv');
    // res.setHeader('Content-Disposition', 'attachment; filename="device-values.csv"');

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error('❌ Error exporting values:', err);
    return res.status(400).json({
      error: 'Failed to export values',
      message: err.message,
    });
  }
};
