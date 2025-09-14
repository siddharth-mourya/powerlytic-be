import { Device } from './Device.model';
import { DeviceModel } from '../DeviceModel/DeviceModel.model';
import { IPort, Port } from '../Port/Port.model';

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
  const model = await DeviceModel.findById(data.deviceModelId);
  if (!model) throw new Error('Device model not found');

  // 3. Create Device
  const device = await Device.create(data);

  // 4. Auto-create Ports based on model
  const portsArray: Array<Partial<IPort>> = [];
  model.ports.map(async (port, index) => {
    const portNumber = index + 1;
    portsArray.push({
      deviceId: device._id,
      name: `${port.portTypeId}-${portNumber}`,
      portNumber,
      portTypeId: port.portTypeId,
    });
  });
  const ports = await Port.insertMany(portsArray);
  return { device, ports };
};

export const getDevices = async (query: any) => {
  const filter: any = {};
  if (query.organizationId) filter.organizationId = query.organizationId;
  if (query.deviceModelId) filter.deviceModelId = query.deviceModelId;
  if (query.status) filter.status = query.status;

  return Device.find(filter).populate('deviceModelId').lean();
};

export const getDeviceById = async (id: string) => {
  return Device.findById(id).populate('deviceModelId').lean();
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
