import mongoose, { Schema, model, Document } from 'mongoose';
import { IOrganization } from '../Organization/Organization.model';
import { IDevice } from '../Device/Device.model';
import { IPort } from '../Port/Port.model';

export interface IValue extends Document {
  ts: Date;
  ingestTs: Date;
  metadata: {
    orgId: IOrganization['_id'];
    deviceId: IDevice['_id'];
    portId: IPort['_id'];
  };
  rawValue: any;
  calibratedValue?: number;
  quality?: 'good' | 'bad' | 'uncertain';
  rawPayload?: Record<string, any>;
}

const ValueSchema = new Schema<IValue>(
  {
    ts: { type: Date, required: true },
    ingestTs: { type: Date, default: Date.now },
    metadata: {
      orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
      deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
      portId: { type: Schema.Types.ObjectId, ref: 'Port', required: true },
    },
    rawValue: { type: Schema.Types.Mixed, required: true },
    calibratedValue: { type: Schema.Types.Mixed },
    quality: { type: String, enum: ['good', 'bad', 'uncertain'], default: 'good' },
    rawPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: false },
);

export const Value = model<IValue>('Value', ValueSchema, 'values');

// ✅ Fixed: Use collection.options() instead of info.options
export async function initValueCollection() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error(
      'mongoose.connection.db is not available. Call this after connecting to mongoose.',
    );
  }

  const existing = await db.listCollections({ name: 'values' }).toArray();
  if (existing.length === 0) {
    await db.createCollection('values', {
      timeseries: {
        timeField: 'ts',
        metaField: 'metadata',
        granularity: 'seconds',
      },
    });
    console.log('✅ Created time-series collection: values');
  } else {
    const coll = db.collection('values');
    const opts = await coll.options();
    if (opts && 'timeseries' in opts) {
      console.log("✅ 'values' is already a time-series collection");
    } else {
      console.warn(
        "⚠️ 'values' exists but is not a time-series collection. Consider migrating or using a new collection name.",
      );
    }
  }

  await db.collection('values').createIndex({ 'metadata.deviceId': 1, ts: -1 });
  await db.collection('values').createIndex({ 'metadata.portId': 1, ts: -1 });
  console.log('✅ Created indexes on values collection');
}
