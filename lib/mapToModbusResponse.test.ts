import { mapModbusResponse } from './mapModbusResponse';
import { statusResponse, offResponse } from './__mockdata__/statusResponse';

describe('mapToModbusResponse', () => {
  it('maps packet to Modbus response', () => {
    expect(mapModbusResponse(statusResponse)).toMatchSnapshot();
  });
  it('maps packet to Modbus response when device is off', () => {
    expect(mapModbusResponse(offResponse)).toMatchSnapshot();
  });
});
