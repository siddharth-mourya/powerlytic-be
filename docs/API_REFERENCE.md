# API Reference: Device Values & Display

## Overview

The Powerlytic backend provides comprehensive APIs for storing and retrieving device values with optimized responses for various UI use cases.

**Base URL**: `/api/devices/:deviceId/values`

---

## Data Ingestion

### POST /api/devices/:deviceId/values

Store values from a physical device with automatic transformation.

**Request Body:**

```json
{
  "deviceId": "device123",
  "ts": "2025-01-10T14:30:00Z",
  "values": {
    "DI_1": 0,
    "DI_2": 1,
    "AI_1": 23.5,
    "AI_2": 48.7,
    "MI_1": [
      {
        "slave_id": 1,
        "registers": [
          { "readId": "read-uuid-1", "value": [23223] },
          { "readId": "read-uuid-2", "value": [101, 102] },
          { "readId": "read-uuid-3", "value": [3001, 3002, 3003, 3004] }
        ]
      },
      {
        "slave_id": 2,
        "registers": [{ "readId": "read-uuid-4", "value": [15000] }]
      }
    ]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 8,
    "message": "Successfully transformed and stored 8 value(s)"
  }
}
```

**Automatic Processing:**

- ✅ Applies port calibration to DI/AI values
- ✅ Parses modbus registers with endianness conversion
- ✅ Applies read-level and port-level calibration
- ✅ Stores as individual Value documents (one per reading)
- ✅ Retrieves organizationId from device schema

**Status Codes:**

- `201 Created`: Values successfully stored
- `400 Bad Request`: Invalid payload format
- `404 Not Found`: Device not found

---

## Data Retrieval & Views

### GET /api/devices/:deviceId/values/table

**Purpose**: Get all device values organized by timestamp (perfect for data tables)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startTime | ISO Date | - | Start of time range |
| endTime | ISO Date | - | End of time range |
| limit | Number | 1000 | Max rows to return |

**Response Format:**

```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "ts": "2025-01-10T14:30:00Z",
      "DI_1": {
        "rawValue": 1,
        "calibratedValue": 1,
        "portType": "DIGITAL_INPUT"
      },
      "AI_1": {
        "rawValue": 250,
        "calibratedValue": -15,
        "unit": "°C",
        "portType": "ANALOG_INPUT"
      },
      "MI_1": {
        "1_Temperature": {
          "readId": "read-1",
          "slaveId": 1,
          "readName": "Temperature",
          "tag": "TEMP_SENSOR_1",
          "rawValue": 10023,
          "calibratedValue": 1002.3,
          "unit": "kPa",
          "registers": {
            "rawRegisters": ["0x272F"],
            "parsedValue": 10023,
            "bitsToRead": 16,
            "endianness": "ABCD"
          }
        },
        "2_Pressure": {
          "readId": "read-2",
          "slaveId": 2,
          "readName": "Pressure",
          "tag": "PRESS_SENSOR_1",
          "rawValue": 2953,
          "calibratedValue": 22.15,
          "unit": "°C"
        }
      }
    },
    {
      "ts": "2025-01-10T14:31:00Z",
      "DI_1": { "rawValue": 0, "calibratedValue": 0 },
      "AI_1": { "rawValue": 248, "calibratedValue": -16.5, "unit": "°C" },
      "MI_1": {
        "1_Temperature": { "rawValue": 10025, "calibratedValue": 1002.5, "unit": "kPa" },
        "2_Pressure": { "rawValue": 2951, "calibratedValue": 22.13, "unit": "°C" }
      }
    }
  ]
}
```

**Use Cases:**

- Display in data table with sortable columns
- Export to CSV for reports
- Real-time dashboard updates
- Historical data analysis

---

### GET /api/devices/:deviceId/values/snapshot

**Purpose**: Get the latest value for each port (perfect for status dashboard)

**Query Parameters**: None

**Response Format:**

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-10T14:35:00Z",
    "ports": {
      "DI_1": {
        "name": "Door Sensor",
        "value": 1,
        "rawValue": 1,
        "unit": null,
        "timestamp": "2025-01-10T14:35:00Z",
        "quality": "good"
      },
      "AI_1": {
        "name": "Temperature Sensor",
        "value": -15,
        "rawValue": 250,
        "unit": "°C",
        "timestamp": "2025-01-10T14:35:00Z",
        "quality": "good"
      },
      "MI_1": {
        "1": {
          "Temperature": {
            "readId": "read-uuid-1",
            "name": "Temperature",
            "tag": "TEMP_SENSOR",
            "value": 1002.3,
            "rawValue": 10023,
            "unit": "kPa",
            "timestamp": "2025-01-10T14:35:00Z",
            "quality": "good",
            "registers": {
              "rawRegisters": ["0x272F"],
              "parsedValue": 10023,
              "bitsToRead": 16,
              "endianness": "ABCD"
            }
          }
        },
        "2": {
          "Pressure": {
            "readId": "read-uuid-2",
            "name": "Pressure",
            "tag": "PRESS_SENSOR",
            "value": 22.15,
            "rawValue": 2953,
            "unit": "°C",
            "timestamp": "2025-01-10T14:35:00Z",
            "quality": "good"
          }
        }
      }
    }
  }
}
```

**Use Cases:**

- Dashboard status cards
- Device health indicators
- Quick overview of current readings

---

### GET /api/devices/:deviceId/values/timeseries/:portKey

**Purpose**: Get time-series data for a port (perfect for charts)

**Route Parameters:**

- `portKey` (string): Port identifier (e.g., "AI_1", "DI_1")

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startTime | ISO Date | - | Start of time range |
| endTime | ISO Date | - | End of time range |
| limit | Number | 10000 | Max data points |

**Response Format:**

```json
{
  "success": true,
  "data": {
    "portKey": "AI_1",
    "name": "Temperature Sensor",
    "unit": "°C",
    "dataPoints": [
      {
        "ts": "2025-01-10T14:30:00Z",
        "value": -15,
        "rawValue": 250,
        "quality": "good"
      },
      {
        "ts": "2025-01-10T14:31:00Z",
        "value": -14.5,
        "rawValue": 255,
        "quality": "good"
      },
      {
        "ts": "2025-01-10T14:32:00Z",
        "value": -16,
        "rawValue": 248,
        "quality": "good"
      }
    ],
    "stats": {
      "count": 1000,
      "minValue": -20,
      "maxValue": 5,
      "avgValue": -8.5,
      "firstTimestamp": "2025-01-10T00:00:00Z",
      "lastTimestamp": "2025-01-10T14:35:00Z"
    }
  }
}
```

**Use Cases:**

- Line charts
- Area charts
- Trend analysis
- Anomaly detection

---

### GET /api/devices/:deviceId/values/timeseries/modbus/:readId

**Purpose**: Get time-series data for a modbus read

**Route Parameters:**

- `readId` (string): Modbus read identifier

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startTime | ISO Date | - | Start of time range |
| endTime | ISO Date | - | End of time range |
| limit | Number | 10000 | Max data points |

**Response Format:**

```json
{
  "success": true,
  "data": {
    "readId": "read-uuid-1",
    "name": "Temperature Sensor",
    "tag": "TEMP_SENSOR_1",
    "unit": "kPa",
    "dataPoints": [
      {
        "ts": "2025-01-10T14:30:00Z",
        "value": 1002.3,
        "rawValue": 10023,
        "quality": "good",
        "registers": {
          "rawRegisters": ["0x272F"],
          "parsedValue": 10023,
          "bitsToRead": 16,
          "endianness": "ABCD"
        }
      }
    ],
    "stats": {
      "count": 500,
      "minValue": 1000,
      "maxValue": 1005,
      "avgValue": 1002.5,
      "firstTimestamp": "2025-01-10T00:00:00Z",
      "lastTimestamp": "2025-01-10T14:35:00Z"
    }
  }
}
```

---

### GET /api/devices/:deviceId/values/status

**Purpose**: Get quick device status summary

**Query Parameters**: None

**Response Format:**

```json
{
  "success": true,
  "data": {
    "deviceId": "device-123",
    "deviceName": "Monitor Unit 1",
    "lastUpdate": "2025-01-10T14:35:00Z",
    "portCount": 5,
    "portStatus": {
      "DI_1": {
        "name": "Door Sensor",
        "value": 1,
        "unit": null,
        "lastUpdate": "2025-01-10T14:35:00Z",
        "quality": "good"
      },
      "AI_1": {
        "name": "Temperature Sensor",
        "value": -15,
        "unit": "°C",
        "lastUpdate": "2025-01-10T14:35:00Z",
        "quality": "good"
      },
      "MI_1": {
        "name": "Modbus Port 1",
        "readCount": 2,
        "slaveCount": 2,
        "lastUpdate": "2025-01-10T14:35:00Z",
        "quality": "unknown"
      }
    }
  }
}
```

**Use Cases:**

- Device health check
- Status page
- Overview cards

---

### GET /api/devices/:deviceId/values/export

**Purpose**: Export device values in CSV-ready format

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startTime | ISO Date | - | Start of time range |
| endTime | ISO Date | - | End of time range |

**Response Format:**

```json
{
  "success": true,
  "count": 1000,
  "data": [
    {
      "timestamp": "2025-01-10T14:30:00Z",
      "DI_1_value": 1,
      "AI_1_value": -15,
      "AI_1_unit": "°C",
      "MI_1_1_Temperature_value": 1002.3,
      "MI_1_1_Temperature_unit": "kPa",
      "MI_1_2_Pressure_value": 22.15,
      "MI_1_2_Pressure_unit": "°C"
    },
    {
      "timestamp": "2025-01-10T14:31:00Z",
      "DI_1_value": 0,
      "AI_1_value": -16.5,
      "AI_1_unit": "°C",
      "MI_1_1_Temperature_value": 1002.5,
      "MI_1_1_Temperature_unit": "kPa",
      "MI_1_2_Pressure_value": 22.13,
      "MI_1_2_Pressure_unit": "°C"
    }
  ]
}
```

**Use Cases:**

- CSV export for reports
- Data analysis
- Integration with external tools

---

## Legacy Endpoints (For Reference)

### GET /api/devices/:deviceId/values

Get raw values with filters

### GET /api/devices/:deviceId/values/latest

Get latest value for each port

### GET /api/devices/:deviceId/values/port/:portKey

Get values for specific port

### GET /api/devices/:deviceId/values/modbus/:readId

Get values for specific modbus read

### GET /api/devices/:deviceId/values/stats/:portKey

Get statistics for a port

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common Status Codes:**

- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Best Practices

### For Table Views

1. Use `/table` endpoint with date range filters
2. Implement pagination using `limit` parameter
3. Sort by timestamp on the backend
4. Cache snapshot data for dashboard

### For Charts

1. Use `/timeseries/:portKey` or `/timeseries/modbus/:readId`
2. Set appropriate `limit` based on chart granularity
3. Cache stats for aggregate views
4. Use `startTime`/`endTime` for date range selection

### For Dashboards

1. Load `/snapshot` for current status
2. Load `/status` for device health
3. Refresh every 30 seconds for real-time updates
4. Implement fallback for network errors

### For Data Export

1. Use `/export` endpoint with date range
2. Implement streaming for large datasets
3. Set appropriate filename with timestamp
4. Provide download progress indication

---

## Rate Limiting

Current implementation supports high-throughput reads. For specific rate limiting requirements, contact backend team.

---

## Authentication

All endpoints require valid JWT token in `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## Data Models

### Value Document

```typescript
{
  _id: ObjectId;
  metadata: {
    deviceId: ObjectId;
    organizationId: ObjectId;
  };
  ts: Date;
  port: {
    portKey: string;
    name: string;
    portType: string;
    unit?: string;
  };
  rawValue: number;
  calibratedValue: number;
  quality: string;
  modbusRead?: {
    readId: string;
    slaveId: number;
    name: string;
    tag?: string;
  };
  modbusRegisters?: {
    rawRegisters: string[];
    parsedValue: number;
    bitsToRead: number;
    endianness: string;
  };
}
```

### Device Configuration

```typescript
{
  _id: ObjectId;
  name: string;
  organizationId: ObjectId;
  ports: {
    portKey: string;
    name: string;
    portType: "DIGITAL_INPUT" | "ANALOG_INPUT" | "MODBUS_INPUT";
    unit?: string;
    calibration?: {
      scale: number;
      offset: number;
    };
    modbusSlaves?: {
      slaveId: number;
      reads: {
        readId: string;
        name: string;
        tag?: string;
        bitsToRead: number;
        endianness: string;
        calibration?: {
          scale: number;
          offset: number;
        };
      }[];
    }[];
  }[];
}
```

---

## Examples

### Get Temperature Readings for Last 24 Hours

```bash
curl -X GET "http://localhost:3000/api/devices/device-123/values/timeseries/AI_1?startTime=2025-01-09T14:35:00Z&endTime=2025-01-10T14:35:00Z" \
  -H "Authorization: Bearer <token>"
```

### Get All Values in Table Format

```bash
curl -X GET "http://localhost:3000/api/devices/device-123/values/table?limit=500" \
  -H "Authorization: Bearer <token>"
```

### Store New Values

```bash
curl -X POST "http://localhost:3000/api/devices/device-123/values" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-123",
    "ts": "2025-01-10T14:30:00Z",
    "values": {
      "DI_1": 1,
      "AI_1": 25.5,
      "MI_1": [{
        "slave_id": 1,
        "registers": [
          { "readId": "read-1", "value": [10023] }
        ]
      }]
    }
  }'
```

---

## Support

For issues or questions, contact: backend-team@powerlytic.io
