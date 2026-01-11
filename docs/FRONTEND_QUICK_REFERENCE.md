# 🚀 Frontend Quick Reference

## API Base URL

```
/api/devices/:deviceId/values
```

Replace `:deviceId` with actual device ID (e.g., "device-123")

---

## Endpoints Summary

### 📊 Dashboard & Status

| Endpoint    | Method | Purpose                    | Returns              |
| ----------- | ------ | -------------------------- | -------------------- |
| `/snapshot` | GET    | Latest value for each port | Latest readings      |
| `/status`   | GET    | Device health summary      | Device + port status |

### 📈 Data Display

| Endpoint                     | Method | Purpose                             | Returns             |
| ---------------------------- | ------ | ----------------------------------- | ------------------- |
| `/table`                     | GET    | All readings organized by timestamp | Array of readings   |
| `/timeseries/:portKey`       | GET    | Time-series data for port (charts)  | Data points + stats |
| `/timeseries/modbus/:readId` | GET    | Time-series data for modbus read    | Data points + stats |

### 💾 Data Management

| Endpoint  | Method | Purpose        | Returns         |
| --------- | ------ | -------------- | --------------- |
| `/export` | GET    | CSV-ready data | Flattened array |

### 📥 Data Ingestion

| Endpoint | Method | Purpose             | Returns                |
| -------- | ------ | ------------------- | ---------------------- |
| `/`      | POST   | Store device values | Count of stored values |

---

## Quick Copy-Paste Examples

### Get Dashboard Data

```javascript
const deviceId = 'device-123';
const response = await fetch(`/api/devices/${deviceId}/values/snapshot`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
console.log(data.data.ports); // { DI_1: {...}, AI_1: {...}, MI_1: {...} }
```

### Get Table Data

```javascript
const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const end = new Date().toISOString();

const response = await fetch(
  `/api/devices/${deviceId}/values/table?startTime=${start}&endTime=${end}&limit=100`,
  { headers: { Authorization: `Bearer ${token}` } },
);
const data = await response.json();
console.log(data.data); // Array of readings by timestamp
```

### Get Chart Data

```javascript
const portKey = 'AI_1'; // or any port like "DI_1", "MI_1"
const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const end = new Date().toISOString();

const response = await fetch(
  `/api/devices/${deviceId}/values/timeseries/${portKey}?startTime=${start}&endTime=${end}`,
  { headers: { Authorization: `Bearer ${token}` } },
);
const data = await response.json();
console.log(data.data.dataPoints); // Array for charts
console.log(data.data.stats); // Min, max, avg, count
```

### Export Data

```javascript
const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const end = new Date().toISOString();

const response = await fetch(
  `/api/devices/${deviceId}/values/export?startTime=${start}&endTime=${end}`,
  { headers: { Authorization: `Bearer ${token}` } },
);
const data = await response.json();
// Convert to CSV
const csv = convertToCSV(data.data);
```

---

## Response Format Cheat Sheet

### Snapshot Response

```javascript
{
  timestamp: "2025-01-10T14:35:00Z",
  ports: {
    "DI_1": { name, value, unit, quality, timestamp },
    "AI_1": { name, value, unit, quality, timestamp },
    "MI_1": {
      "SlaveId": {
        "ReadName": { value, unit, quality, timestamp }
      }
    }
  }
}
```

### Table Response

```javascript
[
  {
    ts: '2025-01-10T14:35:00Z',
    DI_1: { rawValue, calibratedValue },
    AI_1: { rawValue, calibratedValue, unit },
    MI_1: {
      SlaveId_ReadName: { rawValue, calibratedValue, unit },
    },
  },
];
```

### Time-Series Response

```javascript
{
  portKey: "AI_1",
  name: "Temperature Sensor",
  unit: "°C",
  dataPoints: [
    { ts: "2025-01-10T14:30:00Z", value: -15, rawValue: 250 },
    { ts: "2025-01-10T14:31:00Z", value: -14.5, rawValue: 255 }
  ],
  stats: {
    count: 1000,
    minValue: -20,
    maxValue: 5,
    avgValue: -8.5,
    firstTimestamp: "2025-01-10T00:00:00Z",
    lastTimestamp: "2025-01-10T14:35:00Z"
  }
}
```

### Status Response

```javascript
{
  deviceId: "device-123",
  deviceName: "Monitor Unit 1",
  lastUpdate: "2025-01-10T14:35:00Z",
  portCount: 5,
  portStatus: {
    "DI_1": { name, value, unit, lastUpdate, quality },
    "AI_1": { name, value, unit, lastUpdate, quality },
    "MI_1": { name, readCount, slaveCount, lastUpdate }
  }
}
```

---

## Query Parameters

### Common Parameters

| Parameter | Type     | Example                | Notes                   |
| --------- | -------- | ---------------------- | ----------------------- |
| startTime | ISO Date | `2025-01-09T00:00:00Z` | Start of range          |
| endTime   | ISO Date | `2025-01-10T00:00:00Z` | End of range            |
| limit     | Number   | `100`                  | Max rows (default 1000) |

### Examples

```javascript
// Last 24 hours
const 24hAgo = new Date(Date.now() - 24*3600*1000).toISOString();
const now = new Date().toISOString();

// Last 7 days
const 7dAgo = new Date(Date.now() - 7*24*3600*1000).toISOString();

// Last 30 days
const 30dAgo = new Date(Date.now() - 30*24*3600*1000).toISOString();

// Custom date range
const start = "2025-01-01T00:00:00Z";
const end = "2025-01-31T23:59:59Z";
```

---

## React Hooks

### Custom Hook for Snapshot

```typescript
import { useState, useEffect } from 'react';

function useDeviceSnapshot(deviceId: string, refreshInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await fetchAPI(`/api/devices/${deviceId}/values/snapshot`);
      setData(res.data);
      setLoading(false);
    };

    fetch();
    const interval = setInterval(fetch, refreshInterval);
    return () => clearInterval(interval);
  }, [deviceId]);

  return { data, loading };
}
```

### Custom Hook for Table

```typescript
function useDeviceTable(deviceId: string, startDate: Date, endDate: Date) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const url =
        `/api/devices/${deviceId}/values/table?` +
        `startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`;
      const res = await fetchAPI(url);
      setData(res.data);
      setLoading(false);
    };

    fetch();
  }, [deviceId, startDate, endDate]);

  return { data, loading };
}
```

### Custom Hook for Time-Series

```typescript
function useTimeSeries(deviceId: string, portKey: string, startDate: Date, endDate: Date) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const url =
        `/api/devices/${deviceId}/values/timeseries/${portKey}?` +
        `startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`;
      const res = await fetchAPI(url);
      setData(res.data);
      setLoading(false);
    };

    fetch();
  }, [deviceId, portKey, startDate, endDate]);

  return { data, loading };
}
```

---

## Formatting Helpers

### Format DI Values

```javascript
function formatDIValue(value) {
  return value === 1 ? 'ON' : 'OFF';
}
// Or just use: value ? "ON" : "OFF"
```

### Format AI Values

```javascript
function formatAIValue(value, unit) {
  return `${value.toFixed(2)}${unit ? ' ' + unit : ''}`;
}
// Usage: formatAIValue(-15, "°C") → "-15.00 °C"
```

### Format Timestamp

```javascript
function formatTimestamp(isoString) {
  return new Date(isoString).toLocaleString();
}
// Usage: formatTimestamp("2025-01-10T14:35:00Z") → "1/10/2025, 2:35:00 PM"
```

### Format for CSV

```javascript
function convertToCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) => Object.values(row).join(','));
  return [headers, ...rows].join('\n');
}
```

---

## Error Handling

### Standard Error Response

```javascript
{
  error: "Error type",
  message: "Detailed error message"
}
```

### Error Handling Pattern

```javascript
async function fetchAPI(url) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    return await res.json();
  } catch (err) {
    console.error('API Error:', err.message);
    // Show user-friendly message
    return null;
  }
}
```

---

## Common Patterns

### Pattern 1: Dashboard Auto-Refresh

```javascript
useEffect(() => {
  const fetch = async () => {
    const data = await fetchAPI(`/api/devices/${deviceId}/values/snapshot`);
    setSnapshot(data.data);
  };

  fetch(); // Initial fetch
  const interval = setInterval(fetch, 30000); // Refresh every 30s

  return () => clearInterval(interval);
}, [deviceId]);
```

### Pattern 2: Table with Pagination

```javascript
const [page, setPage] = useState(1);
const pageSize = 50;

const start = page === 1 ? 0 : (page - 1) * pageSize;
const params = `&limit=${pageSize}`;

// Fetch with offset
const response = await fetch(`...?startTime=...&endTime=...${params}`);
```

### Pattern 3: Date Range Picker

```javascript
const [dateRange, setDateRange] = useState({
  startDate: new Date(Date.now() - 24 * 3600 * 1000),
  endDate: new Date(),
});

const handleDateChange = (start, end) => {
  setDateRange({ startDate: start, endDate: end });
  // API call will trigger via useEffect
};
```

### Pattern 4: Chart with Recharts

```javascript
import { LineChart, Line, XAxis, YAxis } from 'recharts';

const timeSeriesData = await fetchAPI(`...timeseries/AI_1?...`);

<LineChart data={timeSeriesData.dataPoints}>
  <XAxis dataKey="ts" />
  <YAxis />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>;
```

---

## Troubleshooting

| Issue               | Solution                                     |
| ------------------- | -------------------------------------------- |
| API returns 401     | Check token validity, re-authenticate        |
| API returns 404     | Verify deviceId is correct, device exists    |
| Empty data          | Check date range, values may not exist       |
| Slow table          | Reduce limit parameter, implement pagination |
| Chart not rendering | Check dataPoints has valid timestamps        |
| CORS errors         | Ensure backend allows frontend origin        |

---

## Tips & Tricks

### Tip 1: Debounce Date Changes

```javascript
const [searchParams, setSearchParams] = useState({...});

const debouncedFetch = debounce((params) => {
  fetchData(params);
}, 500);

useEffect(() => {
  debouncedFetch(searchParams);
}, [searchParams]);
```

### Tip 2: Cache Snapshot Data

```javascript
const cacheRef = useRef(null);
const cacheTimeRef = useRef(0);

const getSnapshot = async () => {
  if (Date.now() - cacheTimeRef.current < 10000) {
    return cacheRef.current; // Use cache
  }
  // Fetch fresh data
  const data = await fetchAPI(...);
  cacheRef.current = data;
  cacheTimeRef.current = Date.now();
  return data;
};
```

### Tip 3: Lazy Load Charts

```javascript
const [showChart, setShowChart] = useState(false);

// Only fetch chart data when needed
useEffect(() => {
  if (showChart) {
    fetchTimeSeriesData();
  }
}, [showChart]);
```

### Tip 4: Validation

```javascript
function validateResponse(data) {
  if (!data || !data.data) {
    throw new Error('Invalid response format');
  }
  return data.data;
}
```

---

## Resources

- **Full API Docs**: `docs/API_REFERENCE.md`
- **UI Spec**: `docs/UI_SPECIFICATION.md`
- **Implementation Guide**: `docs/IMPLEMENTATION_GUIDE.md`
- **Project Summary**: `docs/PROJECT_SUMMARY.md`

---

## Support

**Questions?** Ask backend team or check the comprehensive docs.

**Found a bug?** Report to backend-team@powerlytic.io

---

**Version**: 1.0 | **Last Updated**: 2025-01-10
