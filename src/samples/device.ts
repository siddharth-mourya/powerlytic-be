const device = {
  _id: '665f1a2a9b2c3f001234abcd',
  name: 'Energy-Monitor-Unit-01',
  imei: '865734056789123',
  deviceModelId: '665f19999b2c3f0012340001',
  organizationId: '665f18888b2c3f0012339999',

  status: 'online',

  location: {
    lat: 19.076,
    lng: 72.8777,
    address: 'Factory Floor - Panel A',
  },

  metadata: {
    firmwareVersion: 'v1.2.4',
    hardwareRevision: 'R3',
    installedBy: 'Powerlytic Team',
  },

  ports: [
    /* ---------------- DIGITAL INPUT ---------------- */
    {
      portKey: 'DI1',
      name: 'Main Power Status',
      portType: '665f1porttypeDIGITALIN',
      unit: '',
      calibrationValue: {
        scaling: 1,
        offset: 0,
      },
      status: 'ACTIVE',
      thresholds: {
        min: 0,
        max: 1,
        message: 'Invalid digital state',
      },
    },

    /* ---------------- ANALOG INPUT ---------------- */
    {
      portKey: 'AI1',
      name: 'Temperature Sensor',
      portType: '665f1porttypeANALOGIN',
      unit: '°C',
      calibrationValue: {
        scaling: 0.1,
        offset: -10,
      },
      status: 'ACTIVE',
      thresholds: {
        min: 0,
        max: 80,
        message: 'Temperature out of safe range',
      },
    },

    /* ---------------- MODBUS PORT ---------------- */
    {
      portKey: 'MI1',
      name: 'Energy Meter (RS485)',
      portType: '665f1porttypeMODBUS',
      unit: '',
      status: 'ACTIVE',

      modbusSlaves: [
        {
          name: 'Energy Meter Slave 1',
          serial: {
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
          },
          polling: {
            intervalMs: 1000,
            timeoutMs: 300,
            retries: 3,
          },

          registers: [
            {
              portKey: 'MB1_VOLTAGE_L1',
              registerType: 'input',
              functionCode: 4,
              startAddress: 0,
              bitsToRead: 32,
              registerCount: 2,
              name: 'Voltage Phase L1',
              description: 'Phase L1 voltage',
              dataType: 'float32',
              endianness: 'CDAB',
              scaling: 1,
              offset: 0,
              unit: 'V',
              tag: 'voltage_l1',
            },
            {
              portKey: 'MB1_CURRENT_L1',
              registerType: 'input',
              functionCode: 4,
              startAddress: 2,
              bitsToRead: 32,
              registerCount: 2,
              name: 'Current Phase L1',
              description: 'Phase L1 current',
              dataType: 'float32',
              endianness: 'CDAB',
              scaling: 0.01,
              offset: 0,
              unit: 'A',
              tag: 'current_l1',
            },
            {
              portKey: 'MB1_TOTAL_ENERGY',
              registerType: 'holding',
              functionCode: 3,
              startAddress: 2000,
              bitsToRead: 64,
              registerCount: 4,
              name: 'Total Energy',
              description: 'Cumulative energy consumption',
              dataType: 'uint64',
              endianness: 'DCBA',
              scaling: 0.1,
              offset: 0,
              unit: 'kWh',
              tag: 'energy_total',
            },
            {
              portKey: 'MB1_ALARM_OV',
              registerType: 'coil',
              functionCode: 1,
              startAddress: 1010,
              bitsToRead: 1,
              name: 'Over Voltage Alarm',
              description: 'Over-voltage alarm bit',
              dataType: 'boolean',
              unit: '',
              tag: 'alarm_ov',
            },
          ],
        },

        /* -------- SECOND MODBUS SLAVE (DIFFERENT CONFIG) -------- */
        {
          name: 'Power Analyzer Slave 2',
          serial: {
            baudRate: 19200,
            dataBits: 8,
            stopBits: 1,
            parity: 'even',
          },
          polling: {
            intervalMs: 5000,
            timeoutMs: 500,
            retries: 2,
          },

          reads: [
            {
              portKey: 'MB1_FREQ',
              registerType: 'input',
              functionCode: 4,
              startAddress: 310,
              bitsToRead: 32,
              registerCount: 2,
              name: 'Grid Frequency',
              description: 'Line frequency',
              dataType: 'float32',
              endianness: 'ABCD',
              scaling: 1,
              offset: 0,
              unit: 'Hz',
              tag: 'frequency',
            },
          ],
        },
      ],
    },
  ],

  pointOfContact: 'maintenance@factory.com',
  alertEmails: ['alerts@factory.com'],
  alertPhones: ['+919999999999'],

  assignedAt: '2024-11-15T10:30:00.000Z',
  lastSeen: '2024-12-10T09:15:30.000Z',
  manufacturingYear: '2024-01-01T00:00:00.000Z',

  createdAt: '2024-11-01T08:00:00.000Z',
  updatedAt: '2024-12-10T09:15:30.000Z',
};
