import mapModbusResponse from './mapModbusResponse';

const result = {
  packet: {
    _deviceId: 'devId',
    _password: '1234',
    _functionType: 6,
    _dataEntries: [
      { parameter: 1, value: { 0: 1 } },
      { parameter: 2, value: { 0: 1 } },
      { parameter: 68, value: { 0: 179 } },
      { parameter: 6, value: { 0: 0 } },
      { parameter: 102, value: { 0: 30 } },
      { parameter: 183, value: { 0: 2 } },
      { parameter: 136, value: { 0: 0 } },
      {
        parameter: 100,
        value: {
          0: 34, 1: 20, 2: 31, 3: 0,
        },
      },
      { parameter: 37, value: { 0: 45 } },
      { parameter: 15, value: { 0: 1 } },
      { parameter: 25, value: { 0: 70 } },
      { parameter: 185, value: { 0: 4, 1: 0 } },
      { parameter: 74, value: { 0: 236, 1: 4 } },
      { parameter: 7, value: { 0: 0 } },
      { parameter: 131, value: { 0: 0 } },
      { parameter: 11, value: { 0: 0, 1: 0, 2: 0 } }],
  },
  ip: '127.0.0.1',
};

describe('mapToModbusResponse', () => {
  it('maps packet to Modbus response', () => {
    expect(mapModbusResponse(result)).toMatchSnapshot();
  });
});
