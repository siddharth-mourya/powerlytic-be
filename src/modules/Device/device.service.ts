import { Device } from './Device.model';
import { DeviceModel } from '../DeviceModel/DeviceModel.model';
import { randomUUID } from 'crypto';
import { getRegisterType } from '../../utils/constants/modbus';

interface CreateDeviceDto {
  imei: string;
  configId?: string;
  deviceModelId: string;
  name: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

interface UpdateDeviceDto {
  name?: string;
  location?: { lat: number; lng: number; address?: string };
  pointOfContact?: string;
  alertEmails?: string[];
  alertPhones?: string[];
  organizationId?: string;
  status?: 'online' | 'offline' | 'maintenance';
  // Allow updating port properties but NOT adding/removing ports or changing portKey
  ports?: Array<{
    portKey: string;
    unit?: string;
    calibrationValue?: { scaling: number; offset: number };
    thresholds?: { min?: number; max?: number; message?: string };
    modbusSlaves?: any[];
  }>;
  metadata?: Record<string, any>;
}

/**
 * DEVICE CREATION FLOW (Company Admin Only)
 * Step 1: Company creates device with imei, configId, name, deviceModelId
 * Step 2: Ports are auto-populated from DeviceModel - user cannot modify
 * Step 3: Device is marked as 'offline' initially
 */
export const createDevice = async (data: CreateDeviceDto) => {
  delete data.configId; // configId will be generated server-side

  // 1. Ensure device with same IMEI doesn't exist
  const existsImei = await Device.findOne({ imei: data.imei });
  if (existsImei) throw new Error('Device with this IMEI already exists');

  // 2. Ensure device with same configId doesn't exist
  const existsConfig = await Device.findOne({ configId: data.configId });
  if (existsConfig) throw new Error('Device with this configId already exists');

  // 3. Fetch device model and validate it exists
  const model = await DeviceModel.findById(data.deviceModelId).populate('ports.portType');
  if (!model) throw new Error('Device model not found');

  const configId = randomUUID();

  // 4. Build ports array from model.ports with all required fields
  const portsArray = model.ports.map((port: any) => {
    const basePort = {
      portKey: port.portKey,
      name: port.description || `Port ${port.portKey}`,
      portType: port.portType._id,
      unit: '', // Default empty, can be updated later
      calibrationValue: { scaling: 1, offset: 0 }, // Default calibration
      status: 'INACTIVE', // Default status
      thresholds: {}, // No thresholds by default
    };

    // Add modbusSlaves array only for modbus ports
    if (port.portType?.valueFormat === 'MODBUS') {
      return { ...basePort, modbusSlaves: [] };
    }

    return basePort;
  });

  // 5. Create Device with embedded ports from model
  const device = await Device.create({
    imei: data.imei,
    configId: configId,
    deviceModelId: data.deviceModelId,
    name: data.name,
    organizationId: data.organizationId || null,
    metadata: data.metadata || {},
    ports: portsArray,
    status: 'offline', // Devices start offline
  });

  return device.populate('deviceModelId');
};

export const getDevices = async (query: any) => {
  const filter: any = {};
  if (query.organizationId) filter.organizationId = query.organizationId;
  if (query.deviceModelId) filter.deviceModelId = query.deviceModelId;
  if (query.status) filter.status = query.status;
  if (query.configId) filter.configId = query.configId;
  if (query.imei) filter.imei = query.imei;

  return Device.find(filter).populate('deviceModelId').populate('organizationId').lean();
};

export const getDeviceById = async (id: string) => {
  return Device.findById(id).populate('deviceModelId').populate('organizationId').lean();
};

export const getConfigByDeviceId = async (id: string) => {
  const device = await Device.findById(id).lean();
  if (!device) throw new Error('Device not found');
  return {
    deviceId: device._id,
    configId: device.configId,
    imei: device.imei,
    modbusSlaves: device.ports.flatMap((port: any) =>
      (port.modbusSlaves || []).map((slave: any) => ({
        slave_id: slave.slaveId,
        serial: slave.serial,
        polling: slave.polling,
        registers: slave.reads.map((read: any) => ({
          readId: read.readId,
          func: read.functionCode,
          start: read.startAddress,
          bits: read.bitsToRead,
        })),
      })),
    ),
  };
};

/**
 * DEVICE UPDATE FLOW (Company Admin or Buyer)
 * Only allows updating:
 * - name, location, pointOfContact
 * - alertEmails, alertPhones
 * - organizationId (assigning to buyer)
 * - status (online/offline/maintenance)
 * - Port properties: unit, calibrationValue, thresholds, modbusSlaves
 *
 * PREVENTS tampering with:
 * - imei, configId, deviceModelId (immutable)
 * - portKey, portType (cannot add/remove ports or change port definitions)
 */
export const updateDevice = async (id: string, data: UpdateDeviceDto & any) => {
  // Fetch current device and model to validate ports
  const device = await Device.findById(id).populate('deviceModelId');
  if (!device) throw new Error('Device not found');

  const model = await DeviceModel.findById(device.deviceModelId).populate('ports.portType');
  if (!model) throw new Error('Device model not found');

  // Build set of valid portKeys from model
  const validPortKeys = new Set(model.ports.map((p: any) => p.portKey));

  // 1. Prevent updating immutable fields
  delete data.imei;
  delete data.configId;
  delete data.deviceModelId;

  // 2. Validate ports if provided
  if (data.ports) {
    // Ensure no new ports are added
    if (data.ports.length !== device.ports.length) {
      throw new Error('Cannot add or remove ports. Port count must match device model.');
    }

    // Validate each port
    const validatedPorts = data.ports.map((updatedPort: any) => {
      // Ensure portKey exists in model
      if (!validPortKeys.has(updatedPort.portKey)) {
        throw new Error(`Invalid portKey: ${updatedPort.portKey}. Not defined in device model.`);
      }

      // Find original port to preserve non-updatable fields
      const originalPort = device.ports.find((p: any) => p.portKey === updatedPort.portKey);
      if (!originalPort) {
        throw new Error(`Port with key ${updatedPort.portKey} not found in device.`);
      }

      // Validate and process modbus slaves if provided
      let processedModbusSlaves = originalPort.modbusSlaves || [];
      if (updatedPort.modbusSlaves) {
        processedModbusSlaves = updatedPort.modbusSlaves.map((slave: any) => {
          // Generate slaveId if not provided (new slave)
          const slaveId = slave.slaveId || randomUUID();

          // Process reads array and generate readIds
          const processedReads = (slave.reads || []).map((read: any) => {
            // Generate readId if not provided (new read)
            const readId = read.readId || randomUUID();

            // Derive registerType from functionCode
            if (!read.functionCode) {
              throw new Error('functionCode is required for each read');
            }
            const registerType = getRegisterType(read.functionCode);
            if (!registerType) {
              throw new Error(`Invalid functionCode: ${read.functionCode}`);
            }

            return {
              ...read,
              readId, // Set or preserve readId
              slaveId, // Reference to parent slave
              portKey: originalPort.portKey, // Reference to parent port
              registerType, // Derived from functionCode
            };
          });

          return {
            ...slave,
            slaveId, // Set or preserve slaveId
            portKey: originalPort.portKey, // Reference to parent port from model
            reads: processedReads,
          };
        });
      }

      // Only allow updating specific fields
      return {
        portKey: originalPort.portKey, // Immutable
        name: originalPort.name, // Immutable
        portType: originalPort.portType, // Immutable
        unit: updatedPort.unit !== undefined ? updatedPort.unit : originalPort.unit,
        calibrationValue: updatedPort.calibrationValue || originalPort.calibrationValue,
        status: updatedPort.status || originalPort.status,
        thresholds:
          updatedPort.thresholds !== undefined ? updatedPort.thresholds : originalPort.thresholds,
        modbusSlaves: processedModbusSlaves,
      };
    });

    data.ports = validatedPorts;
  }

  // 3. Update device with validated data
  const updated = await Device.findByIdAndUpdate(id, data, { new: true })
    .populate('deviceModelId')
    .populate('organizationId');

  return updated;
};

export const deleteDevice = async (id: string) => {
  return Device.findByIdAndDelete(id);
};
