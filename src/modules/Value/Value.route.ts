import { Router } from 'express';
import * as valueController from './Value.controller';

/**
 * 📊 Value Routes
 *
 * Device value ingestion and retrieval endpoints
 */

const router = Router({ mergeParams: true }); // mergeParams allows access to :deviceId from parent router

/**
 * POST /api/devices/:deviceId/values
 * Store values from device (array of readings)
 */
router.post('/', valueController.storeValues);

/**
 * GET /api/devices/:deviceId/values
 * Query values with optional filters (portKey, readId, startTime, endTime, limit)
 */
router.get('/', valueController.getValues);

/**
 * GET /api/devices/:deviceId/values/latest
 * Get latest value for each port of device
 */
router.get('/latest', valueController.getLatestValues);

/**
 * GET /api/devices/:deviceId/values/port/:portKey
 * Get values for specific port with time filters
 */
router.get('/port/:portKey', valueController.getPortValues);

/**
 * GET /api/devices/:deviceId/values/modbus/:readId
 * Get values for specific modbus read with time filters
 */
router.get('/modbus/:readId', valueController.getModbusReadValues);

/**
 * GET /api/devices/:deviceId/values/stats/:portKey
 * Get statistics for port (min, max, avg, count) over time range
 */
router.get('/stats/:portKey', valueController.getPortStats);

/**
 * GET /api/devices/:deviceId/values/table
 * Get table view: All values organized by timestamp
 * Query params: startTime, endTime, limit
 */
router.get('/table', valueController.getTableView);

/**
 * GET /api/devices/:deviceId/values/snapshot
 * Get latest snapshot: Current value for each port
 */
router.get('/snapshot', valueController.getLatestSnapshot);

/**
 * GET /api/devices/:deviceId/values/timeseries/:portKey
 * Get time-series data for specific port (for charts)
 * Query params: startTime, endTime, limit
 */
router.get('/timeseries/:portKey', valueController.getPortTimeSeries);

/**
 * GET /api/devices/:deviceId/values/timeseries/modbus/:readId
 * Get time-series data for specific modbus read
 * Query params: startTime, endTime, limit
 */
router.get('/timeseries/modbus/:readId', valueController.getModbusReadTimeSeries);

/**
 * GET /api/devices/:deviceId/values/status
 * Get device status summary
 */
router.get('/status', valueController.getStatusSummary);

/**
 * GET /api/devices/:deviceId/values/export
 * Export values as JSON (CSV-ready format)
 * Query params: startTime, endTime
 */
router.get('/export', valueController.getExportData);

export default router;
