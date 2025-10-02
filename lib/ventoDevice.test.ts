import VentoDevice from './ventoDevice';
import { Device } from './__mocks__/homey';
import { statusResponse } from './__mockdata__/statusResponse';

jest.mock('blaubergventojs', () => ({
  ...jest.requireActual('blaubergventojs'),
  BlaubergVentoClient: class BlaubergVentoClient {
        send = jest.fn().mockResolvedValue(statusResponse)
  },
}));

jest.mock('./ventoDiscovery', () => jest.fn().mockImplementation(() => ({
  findById: (id: string) => Promise.resolve({ id, ip: '127.0.0.2' }),
})));

describe('ventoDevice', () => {
  it('should be able to get status from modbus on init', async () => {
    const device = new VentoDevice();
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });

  it('should get and set values trough the api and modbus', async () => {
    const device = new VentoDevice();
    await device.onInit();

    expect({
      modbusCalls: (device.api.modbusClient.send as jest.Mock).mock.calls,
    }).toMatchSnapshot();
  });

  it('should init the api', async () => {
    const device = new VentoDevice();
    await device.onInit();

    const { deviceId, devicePass, deviceIp } = device.api;
    expect({ devicePass, deviceIp, deviceId }).toMatchSnapshot();
  });

  it('should be able to setup all capabilities', async () => {
    const device = new VentoDevice();
    await device.setupCapabilities();

    expect({
      calls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });
});
