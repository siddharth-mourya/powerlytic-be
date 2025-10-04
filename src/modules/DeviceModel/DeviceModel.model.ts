import mongoose, { Schema, Document, Types } from 'mongoose';
import { IPortType } from '../PortType/PortType.model';

export interface IDeviceModel extends Document {
  name: string;
  description: string;
  microControllerType: string;
  ports: {
    portNumber: string;
    portType: IPortType['_id'];
    microControllerPin: string;
    description: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DeviceModelSchema = new Schema<IDeviceModel>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    microControllerType: { type: String, required: true },
    ports: {
      type: [
        {
          portNumber: { type: String, required: true },
          portType: { type: Schema.Types.ObjectId, ref: 'PortType', required: true },
          microControllerPin: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
      required: true,
      validate: {
        validator: function (arr: any[]) {
          return arr.length > 0; // must have at least one port
        },
        message: 'DeviceModel must have at least one port',
      },
    },
  },
  { timestamps: true },
);

export const DeviceModel = mongoose.model<IDeviceModel>('DeviceModel', DeviceModelSchema);

//Model101
const data = {
  name: 'Model101',
  description: 'dfdg',
  microControllerType: 'Arduino Uno',
  ports: [
    {
      portNumber: 'p1',
      deviceDisplayPortName: 'd1', // for UI/device display purposes
      portType: '2345432',
      description: '2345543',
      microControllerPin: 'd3',
    },
    {
      portNumber: 'p2',
      deviceDisplayPortName: 'd1', // for UI/device display purposes
      portType: '2345412',
      description: '2345543',
      microControllerPin: 'd4',
    },
  ],
};
