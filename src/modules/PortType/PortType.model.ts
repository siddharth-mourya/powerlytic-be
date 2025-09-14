import mongoose, { Schema, Document } from 'mongoose';
import { PORT_CATEGORY, PORT_VALUE_FORMAT } from '../../utils/constants/port';

/* Example PortType document

const portType = {
  _id: '2345432',
  name: 'Input port some name',
  category: 'input',
  valueFormat: 'modbus',
  description: 'description',
};

*/

export type PortCategory = keyof typeof PORT_CATEGORY;
export type ValueFormat = keyof typeof PORT_VALUE_FORMAT;

export interface IPortType extends Document {
  name: string;
  category: PortCategory;
  valueFormat: ValueFormat;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortTypeSchema = new Schema<IPortType>(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, enum: Object.keys(PORT_CATEGORY), required: true },
    valueFormat: {
      type: String,
      enum: Object.keys(PORT_VALUE_FORMAT),
      required: true,
    },
    description: { type: String },
  },
  { timestamps: true },
);

export const PortType = mongoose.model<IPortType>('PortType', PortTypeSchema);
