import { Device } from './Device.model';
import { DeviceModel } from '../DeviceModel/DeviceModel.model';

interface CreateDeviceDto {
  imei: string;
  deviceModelId: string;
  name: string;
  metadata?: Record<string, any>;
}

export const createDevice = async (data: CreateDeviceDto) => {
  // 1. Ensure device with same IMEI doesn't exist
  const exists = await Device.findOne({ imei: data.imei });
  if (exists) throw new Error('Device with this IMEI already exists');

  // 2. Fetch device model and its ports
  const model = await DeviceModel.findById(data.deviceModelId).lean();
  if (!model) throw new Error('Device model not found');

  // 3. Build ports array from model.ports
  const portsArray = model.ports.map((port: any, index: number) => ({
    name: `${port.name || 'Port'}-${index + 1}`,
    portNumber: index + 1,
    portType: port.portType,
    calibrationValue: { scaling: 1, offset: 0 },
    status: 'INACTIVE', // default from PORT_STATUS
    thresholds: {},
    slaves: port.type === 'modbus' ? [] : undefined, // empty array for modbus
  }));

  // 4. Create Device with embedded ports
  const device = await Device.create({
    imei: data.imei,
    deviceModelId: data.deviceModelId,
    name: data.name,
    metadata: data.metadata,
    ports: portsArray,
  });

  return device;
};

export const getDevices = async (query: any) => {
  const filter: any = {};
  if (query.organizationId) filter.organizationId = query.organizationId;
  if (query.deviceModelId) filter.deviceModelId = query.deviceModelId;
  if (query.status) filter.status = query.status;

  return Device.find(filter).populate('deviceModelId').lean();
};

export const getDeviceById = async (id: string) => {
  return Device.findById(id).populate('deviceModelId').lean().populate('organizationId');
};

export const updateDevice = async (id: string, data: any) => {
  // Prevent updating immutable fields
  delete data.imei;
  delete data.deviceModelId;

  return Device.findByIdAndUpdate(id, data, { new: true });
};

export const deleteDevice = async (id: string) => {
  return Device.findByIdAndDelete(id);
};
