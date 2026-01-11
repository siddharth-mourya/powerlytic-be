import { Router } from 'express';
import * as valueController from './Value.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

/**
 * 📊 Value Routes
 *
 * Device value ingestion and retrieval endpoints
 * Mounted at /api/values
 *
 * All routes include deviceId in the URL path for proper identification
 */

const router = Router();

/**
 * POST /api/values/devices/:deviceId
 * Store values from device (array of readings)
 */
router.post('/devices/:deviceId', authMiddleware, valueController.storeValues);

/**
 * GET /api/values/devices/:deviceId
 * Query values with optional filters (portKey, readId, startTime, endTime, limit)
 */
router.get('/devices/:deviceId', authMiddleware, valueController.getValues);

/**
 * GET /api/values/devices/:deviceId/latest
 * Get latest value for each port of device
 */
router.get('/devices/:deviceId/latest', authMiddleware, valueController.getLatestValues);

/**
 * GET /api/values/devices/:deviceId/port/:portKey
 * Get values for specific port with time filters
 * Query params: startTime, endTime, limit
 */
router.get('/devices/:deviceId/port/:portKey', authMiddleware, valueController.getPortValues);

/**
 * GET /api/values/devices/:deviceId/modbus/:readId
 * Get values for specific modbus read with time filters
 * Query params: startTime, endTime, limit
 */
router.get(
  '/devices/:deviceId/modbus/:readId',
  authMiddleware,
  valueController.getModbusReadValues,
);

/**
 * GET /api/values/devices/:deviceId/stats/:portKey
 * Get statistics for port (min, max, avg, count) over time range
 * Query params: startTime, endTime (both required)
 */
router.get('/devices/:deviceId/stats/:portKey', authMiddleware, valueController.getPortStats);

/**
 * GET /api/values/devices/:deviceId/table
 * Get table view: All values organized by timestamp
 * Query params: startTime, endTime, limit
 */
router.get('/devices/:deviceId/table', authMiddleware, valueController.getTableView);

/**
 * GET /api/values/devices/:deviceId/snapshot
 * Get latest snapshot: Current value for each port
 */
router.get('/devices/:deviceId/snapshot', authMiddleware, valueController.getLatestSnapshot);

/**
 * GET /api/values/devices/:deviceId/timeseries/:portKey
 * Get time-series data for specific port (for charts)
 * Query params: startTime, endTime, limit
 */
router.get(
  '/devices/:deviceId/timeseries/:portKey',
  authMiddleware,
  valueController.getPortTimeSeries,
);

/**
 * GET /api/values/devices/:deviceId/timeseries/modbus/:readId
 * Get time-series data for specific modbus read
 * Query params: startTime, endTime, limit
 */
router.get(
  '/devices/:deviceId/timeseries/modbus/:readId',
  authMiddleware,
  valueController.getModbusReadTimeSeries,
);

/**
 * GET /api/values/devices/:deviceId/status
 * Get device status summary
 */
router.get('/devices/:deviceId/status', authMiddleware, valueController.getStatusSummary);

/**
 * GET /api/values/devices/:deviceId/export
 * Export values as JSON (CSV-ready format)
 * Query params: startTime, endTime
 */
router.get('/devices/:deviceId/export', authMiddleware, valueController.getExportData);

export default router;
