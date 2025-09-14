import { Schema, model, Document } from 'mongoose';
import { IDevice } from '../Device/Device.model';
import { IPortType } from '../PortType/PortType.model';
import { PORT_STATUS } from '../../utils/constants/port';

/* Example Port document
const port = {
  _id: '2345432',
  deviceId: '2345432',
  name: 'Temperature Sensor',
  portNumber: 1,
  portTypeId: '2345432',
  unit: 'Celsius',
  calibrationValue: {
    scaling: 1.0,
    offset: 0.0,
  },
  status: 'active',
  thresholds: {
    min: -10,
    max: 50,
    message: 'Temperature out of range',
  },
  metadata: { location: 'Room 101' },
};

*/

type Status = keyof typeof PORT_STATUS;
export interface IPort extends Document {
  name: string;
  portNumber: number;
  deviceId: IDevice['_id'];
  portTypeId: IPortType['_id'];
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
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PortSchema = new Schema<IPort>(
  {
    name: { type: String, required: true },
    portNumber: { type: Number, required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    portTypeId: { type: Schema.Types.ObjectId, ref: 'PortType', required: true },
    unit: { type: String },
    calibrationValue: {
      scaling: { type: Number, default: 1 },
      offset: { type: Number, default: 0 },
    },
    status: { type: String, enum: Object.keys(PORT_STATUS), default: PORT_STATUS.INACTIVE },
    thresholds: {
      min: Number,
      max: Number,
      message: String,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Port = model<IPort>('Port', PortSchema);
