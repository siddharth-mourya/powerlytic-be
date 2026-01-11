const config_to_machine = {
  modbusSlaves: [
    {
      slave_id: 1,
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
        { func: 3, start: 0, bits: 15 },
        { func: 3, start: 32, bits: 6 },
        { func: 3, start: 0, bits: 10 },
        { func: 3, start: 100, bits: 6 },
      ],
    },
    {
      slave_id: 2,
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
      polls: [{ func: 4, start: 0, bits: 6 }],
    },
  ],
};
