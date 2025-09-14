import mongoose, { Schema, Document, Types } from 'mongoose';
import { IPortType } from '../PortType/PortType.model';

export interface IDeviceModel extends Document {
  name: string;
  description: string;
  microControllerType: string;
  ports: {
    portNumber: string;
    portTypeId: IPortType['_id'];
    microControllerPin: string;
    description?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

//Model101
const data = {
  name: 'Model101',
  description: 'dfdg',
  microControllerType: 'Arduino Uno',
  ports: [
    {
      portNumber: 'p1',
      portTypeId: '2345432',
      description: '2345543',
      microControllerPin: 'd3',
    },
  ],
};

const DeviceModelSchema = new Schema<IDeviceModel>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    microControllerType: { type: String },
    ports: [
      {
        portNumber: { type: String },
        portTypeId: { type: Schema.Types.ObjectId, ref: 'PortType', required: true },
        microControllerPin: { type: String },
        description: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true },
);

export const DeviceModel = mongoose.model<IDeviceModel>('DeviceModel', DeviceModelSchema);
