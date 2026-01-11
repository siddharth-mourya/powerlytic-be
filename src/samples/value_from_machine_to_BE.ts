const value_from_machine_to_BE = {
  deviceId: 'device123',
  values: {
    DI_1: 0,
    DI_2: 1,
    AI_1: 23.5,
    AI_2: 48.7,
    AI_3: 1023,
    MI_1: [
      {
        slave_id: 1,
        registers: [
          {
            fc_code: 'fc3',
            '0': [23222],
          },
          {
            fc_code: 'fc3',
            '10': [101, 102],
          },
          {
            fc_code: 'fc4',
            '0': [55, 56],
          },
          {
            fc_code: 'fc4',
            '40': [3001, 3002, 3003, 3004],
          },
        ],
      },
      {
        slave_id: 2,
        registers: [
          {
            fc_code: 'fc3',
            '0': [2222],
          },
          {
            fc_code: 'fc3',
            '10': [101, 102],
          },
          {
            fc_code: 'fc4',
            '0': [55, 56],
          },
          {
            fc_code: 'fc4',
            '40': [3001, 3002, 3003, 3004],
          },
        ],
      },
    ],
  },
};
