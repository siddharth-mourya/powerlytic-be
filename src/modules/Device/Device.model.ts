import mongoose, { Schema, Document } from 'mongoose';
import { IOrganization } from '../Organization/Organization.model';
import { IDeviceModel } from '../DeviceModel/DeviceModel.model';
import { IPortType } from '../PortType/PortType.model';
import { PORT_STATUS } from '../../utils/constants/port';

type Status = keyof typeof PORT_STATUS;

export interface IPorts {
  name: string;
  portNumber: number;
  deviceId: IDevice['_id'];
  portType: IPortType['_id'];
  unit?: string;
  calibrationValue?: {
    scaling: number;
    offset: number;
  };
  status?: Status;
  thresholds?: {
    min?: number;
    max?: number;
    message?: string;
  };
  slaves?: {
    id: string;
    name: string;
    serial: {
      baudRate: number;
      dataBits: number;
      stopBits: number;
      parity: 'none' | 'even' | 'odd';
    };
    reads: {
      registerType: 'holding' | 'input' | 'coil' | 'discrete';
      functionCode: number;
      startAddress: number;
      bitsToRead: number;
      name: string;
      description?: string;
      scaling?: number;
      offset?: number;
      unit?: string;
    }[];
  }[];
}

export interface IDevice extends Document {
  name: string;
  imei: string;
  deviceModelId: IDeviceModel['_id'];
  organizationId?: IOrganization['_id'];
  status?: 'online' | 'offline' | 'maintenance';
  location?: { lat?: number; lng?: number; address?: string };
  metadata?: Record<string, any>;
  ports: IPorts[];
  pointOfContact?: string;
  alertEmails?: string[];
  alertPhones?: string[];
  assignedAt?: Date;
  lastSeen?: Date;
  manufacturingYear?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 🔹 Subschemas

const CalibrationSchema = new Schema(
  {
    scaling: { type: Number, default: 1 },
    offset: { type: Number, default: 0 },
  },
  { _id: false },
);

const ThresholdSchema = new Schema(
  {
    min: Number,
    max: Number,
    message: String,
  },
  { _id: false },
);

const ModbusReadSchema = new Schema(
  {
    registerType: { type: String, enum: ['holding', 'input', 'coil', 'discrete'], required: true },
    functionCode: { type: Number, required: true },
    startAddress: { type: Number, required: true },
    bitsToRead: { type: Number, required: true },
    name: { type: String, required: true },
    description: String,
    scaling: Number,
    offset: Number,
    unit: String,
  },
  { _id: false },
);

const ModbusSlaveSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    serial: {
      baudRate: { type: Number, required: true },
      dataBits: { type: Number, required: true },
      stopBits: { type: Number, required: true },
      parity: { type: String, enum: ['none', 'even', 'odd'], required: true },
    },
    reads: [ModbusReadSchema],
  },
  { _id: false },
);

const PortSchema = new Schema(
  {
    name: { type: String, required: true },
    portNumber: { type: Number, required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
    portType: { type: Schema.Types.ObjectId, ref: 'PortType', required: true },
    unit: String,
    calibrationValue: CalibrationSchema,
    status: { type: String, enum: Object.keys(PORT_STATUS) },
    thresholds: ThresholdSchema,
    slaves: [ModbusSlaveSchema], // Only used for Modbus ports
  },
  { _id: false },
);

// 🔹 Main Device Schema
const DeviceSchema = new Schema<IDevice>(
  {
    name: { type: String, required: true },
    imei: { type: String, required: true, unique: true },
    deviceModelId: { type: Schema.Types.ObjectId, ref: 'DeviceModel', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
    location: { lat: Number, lng: Number, address: String },
    metadata: { type: Schema.Types.Mixed },
    ports: [PortSchema],
    pointOfContact: String,
    alertEmails: [String],
    alertPhones: [String],
    assignedAt: Date,
    lastSeen: Date,
    manufacturingYear: Date,
  },
  { timestamps: true },
);

DeviceSchema.index({ imei: 1 }, { unique: true });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
