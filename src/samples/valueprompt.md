Below is how the actual; physical device will send me the values..

```
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
           readId: '1234dsd22',
           value: [23223]
         },
         {
           readId: '1234dsd22',
           value: [101, 102],
         },
         {
           readId: '1234dsd22',
           value: [55, 56],
         },
         {
           readId: '1234dsd22',
           value: [3001, 3002, 3003, 3004],
         },
       ],
     },
     {
       slave_id: 2,
       registers: [
          {
           readId: '1234dsd22',
           value: [23223]
         },
         {
           readId: '1234dsd22',
           value: [101, 102],
         },
         {
           readId: '1234dsd22',
           value: [55, 56],
         },
         {
           readId: '1234dsd22',
           value: [3001, 3002, 3003, 3004],
         },
       ],
     },
   ],
 },
};

```

above is the format the device will send me data to store in my db,
I want to do some trnasformation before storing things

1. In the device.model.ts i have everything for portSchema like calibration, so do it before storing
2. for modbus ports, I have startAddress, bitsToRead, scaling, offset, endianness so we want to do transformation using this..
3. if bitstoRead is 8 - > we get one value in array, if bit's to read is 16 -> we get 2 values in array... and so on. These are values from different registers in hexadecimal. So before storing we need to update it into decimal and following endianness order
