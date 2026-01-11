import mongoose, { Schema, Document } from 'mongoose';

export interface PortInfo {
  portKey: string; // 🔑 unique identity
  portNumber: string; // P1, P2
  portType: mongoose.Types.ObjectId;
  microControllerPin?: string;
  description: string;
}
export interface IDeviceModel extends Document {
  name: string;
  description: string;
  microControllerType: string;
  ports: PortInfo[];
}

const DeviceModelSchema = new Schema<IDeviceModel>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    microControllerType: { type: String, required: true },
    ports: [
      {
        portKey: { type: String, required: true }, // Should not be entered by user and generated internally
        portType: { type: Schema.Types.ObjectId, ref: 'PortType', required: true },
        microControllerPin: String,
        description: String,
      },
    ],
  },
  { timestamps: true },
);

DeviceModelSchema.index({ name: 1, 'ports.portKey': 1 }, { unique: true });

export const DeviceModel = mongoose.model<IDeviceModel>('DeviceModel', DeviceModelSchema);

const data = {
  name: 'EnviroMonitor X100',
  description: 'Advanced environmental monitoring device model X100',
  microControllerType: 'ESP32',
  ports: [
    {
      portKey: 'AI_1',
      portType: new mongoose.Types.ObjectId('64b7f8f4f4d3c2a1b2c3d4e5'), // Example ObjectId
      microControllerPin: 'A0',
      description: 'Temperature Sensor Port',
    },
    {
      portKey: 'AI_2',
      portType: new mongoose.Types.ObjectId('64b7f8f4f4d3c2a1b2c3d4e7'), // Example ObjectId
      microControllerPin: 'A1',
      description: 'Digital Input Port',
    },
    {
      portKey: 'DI_1',
      portType: new mongoose.Types.ObjectId('64b7f8f4f4d3c2a1b2c3d4e8'), // Example ObjectId
      microControllerPin: 'D1',
      description: 'Digital Output Port',
    },
    {
      portKey: 'MI_1',
      portType: new mongoose.Types.ObjectId('64b7f8f4f4d3c2a1b2c3d4e6'), // Example ObjectId
      microControllerPin: 'D2',
      description: 'Humidity Sensor Port',
    },
    {
      portKey: 'MI_2',
      portType: new mongoose.Types.ObjectId('64b7f8f4f4d3c2a1b2c3d4e6'), // Example ObjectId
      microControllerPin: 'D2',
      description: 'Humidity Sensor Port',
    },
  ],
};
