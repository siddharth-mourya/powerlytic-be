import mongoose, { Schema, Document } from 'mongoose';
import { PORT_CATEGORY, PORT_VALUE_FORMAT } from '../../utils/constants/port';

export type PortCategory = keyof typeof PORT_CATEGORY;
export type ValueFormat = keyof typeof PORT_VALUE_FORMAT;

export interface IPortType extends Document {
  name: string;
  category: PortCategory;
  valueFormat: ValueFormat;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  codeName?: string;
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
    codeName: { type: String },
  },
  { timestamps: true },
);

export const PortType = mongoose.model<IPortType>('PortType', PortTypeSchema);

/* Example PortType document

const portType1 = {
  _id: '2345432',
  name: 'Input - Modbus',
  category: 'input',
  valueFormat: 'modbus',
  description: 'description',
  codeName: 'MI',
};


const portType2 = {
  _id: '2345499',
  name: 'Input - Analog',
  category: 'input',
  valueFormat: 'analog',
  description: 'description',
};  
  
const portType3 = {
  _id: '2345498',
  name: 'Input - Digital',
  category: 'input',
  valueFormat: 'digital',
  description: 'description',
};

const portType4 = {
  _id: '2345412',
  name: 'Output - Digital',
  category: 'output',
  valueFormat: 'digital',
  description: 'description',
};

*/
