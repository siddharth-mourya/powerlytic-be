import mongoose, { Schema, model, Document } from 'mongoose';
import { IOrganization } from '../Organization/Organization.model';

/**
 * 📊 IValue Interface
 *
 * Represents a single measurement from any port of a device
 * Stored in a time-series collection optimized for IoT data
 *
 * One document per:
 * - Digital/Analog port reading, OR
 * - Modbus read value (with readId + slaveId)
 *
 * All values from a single device transmission share the same `ts`
 */
export interface IValue extends Document {
  // ⏰ Timestamps
  ts: Date; // Value timestamp (when device measured it)
  ingestTs: Date; // When server received the value

  // 📍 Device & Organization Identification
  metadata: {
    deviceId: string | mongoose.Types.ObjectId; // Which device
    orgId: IOrganization['_id']; // Which organization
  };

  // 🔌 Port Identification
  port: {
    portKey: string; // "DI_1", "AI_1", "MI_1"
    portType: 'DIGITAL' | 'ANALOG' | 'MODBUS'; // Type of port
  };

  // 📡 Modbus-Specific (Only for MODBUS type)
  modbusRead?: {
    readId: string; // Unique read identifier
    slaveId: string; // Modbus slave identifier
    name: string; // Read name (e.g., "Pressure Reading")
    tag: string; // Read tag (e.g., "PRESSURE_01")
  };

  // � Modbus Register Details (for MODBUS readings)
  modbusRegisters?: {
    rawRegisters: string[]; // Original register values as hex (e.g., ["0x5AF0", "0x1234"])
    parsedValue: number; // Value after register parsing & endianness conversion
    bitsToRead: number; // How many bits to read (8, 16, 32, 64)
    endianness: string; // Byte order: ABCD, CDAB, BADC, DCBA, NONE
  };

  // �📊 Actual Values
  rawValue: number | boolean | string; // Raw sensor value (for DI/AI) or parsed modbus value
  calibratedValue?: number | boolean | string; // After scaling & offset
  unit?: string; // Measurement unit (e.g., "°C", "%", "kPa")

  // ✅ Data Quality
  quality?: 'good' | 'bad' | 'uncertain';

  // 🔍 Debug/Audit
  rawPayload?: Record<string, any>;
}

/**
 * ValueSchema - Time-Series Optimized
 *
 * Time-Series Benefits:
 * ✅ Automatic data compression (2x-10x better than regular collections)
 * ✅ Optimized for time-based queries
 * ✅ Built-in downsampling support
 * ✅ Efficient range queries
 * ✅ Automatic data cleanup with TTL
 */
const ValueSchema = new Schema<IValue>(
  {
    // ⏰ Required for time-series: measurement timestamp
    ts: {
      type: Date,
      required: true,
      index: true,
    },

    // ⏱️ When server received the value
    ingestTs: {
      type: Date,
      default: () => new Date(),
      index: true,
    },

    // 📍 Device & Organization metadata (used as time-series meta field)
    metadata: {
      deviceId: {
        type: Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
      },
      orgId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
      },
    },

    // 🔌 Port identification (where this value came from)
    port: {
      portKey: {
        type: String,
        required: true,
      },
      portType: {
        type: String,
        enum: ['DIGITAL', 'ANALOG', 'MODBUS'],
        required: true,
      },
    },

    // 📡 Modbus-specific information (only present for MODBUS readings)
    modbusRead: {
      readId: {
        type: String,
      },
      slaveId: {
        type: String,
      },
      name: {
        type: String,
      },
      tag: {
        type: String,
      },
    },

    // � Modbus Register Details (stores raw registers and parsing metadata)
    modbusRegisters: {
      rawRegisters: {
        type: [String], // Hex string representations of registers ["0x5AF0", "0x1234"]
      },
      parsedValue: {
        type: Number, // Value after register parsing and endianness conversion
      },
      bitsToRead: {
        type: Number, // 8, 16, 32, or 64
      },
      endianness: {
        type: String, // ABCD, CDAB, BADC, DCBA, NONE
      },
    },

    // �📊 Actual measurement values
    rawValue: {
      type: Schema.Types.Mixed,
      required: true,
    },

    calibratedValue: {
      type: Schema.Types.Mixed,
    },

    unit: {
      type: String,
    },
    // 🔍 Original payload for debugging
    rawPayload: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false, // We manage our own timestamps with ts and ingestTs
  },
);

// 📈 Create indexes for efficient querying
// Index 1: Query by device and time (most common)
ValueSchema.index({ 'metadata.deviceId': 1, ts: -1 });

// Index 2: Query by device, port, and time (specific port history)
ValueSchema.index({ 'metadata.deviceId': 1, 'port.portKey': 1, ts: -1 });

// Index 3: Query modbus reads specifically
ValueSchema.index({ 'metadata.deviceId': 1, 'modbusRead.readId': 1, ts: -1 });

// Index 4: Query by organization
ValueSchema.index({ 'metadata.orgId': 1, ts: -1 });

export const Value = model<IValue>('Value', ValueSchema, 'values');

/**
 * Initialize time-series collection
 *
 * Call this once when application starts to set up the time-series collection
 * if it doesn't exist. MongoDB will optimize queries on this collection.
 *
 * Time-series benefits:
 * - Automatic data compression
 * - Optimized for time-based queries
 * - Built-in downsampling support
 * - Efficient range queries
 * - Automatic data retention with TTL
 */
export async function initValueCollection() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error(
      'mongoose.connection.db is not available. Call this after connecting to mongoose.',
    );
  }

  try {
    // Check if 'values' collection exists
    const existing = await db.listCollections({ name: 'values' }).toArray();

    if (existing.length === 0) {
      // Create time-series collection
      await db.createCollection('values', {
        timeseries: {
          timeField: 'ts', // Measurement timestamp
          metaField: 'metadata', // Metadata for grouping (deviceId, orgId)
          granularity: 'seconds', // Data point frequency
        },
      });
      console.log('✅ Created time-series collection: values');
    } else {
      // Verify it's a time-series collection
      const coll = db.collection('values');
      const opts = await coll.options();

      if (opts && 'timeseries' in opts) {
        console.log("✅ 'values' is already a time-series collection");
      } else {
        console.warn(
          "⚠️ 'values' exists but is not a time-series collection.",
          'Consider migrating to time-series for better performance.',
        );
      }
    }

    // Create indexes for efficient querying
    const collection = db.collection('values');
    await collection.createIndex({ 'metadata.deviceId': 1, ts: -1 });
    await collection.createIndex({ 'metadata.deviceId': 1, 'port.portKey': 1, ts: -1 });
    await collection.createIndex({
      'metadata.deviceId': 1,
      'modbusRead.readId': 1,
      ts: -1,
    });
    await collection.createIndex({ 'metadata.orgId': 1, ts: -1 });
    console.log('✅ Created indexes on values collection');
  } catch (err) {
    console.error('❌ Error initializing values collection:', err);
    throw err;
  }
}
