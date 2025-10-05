import VentoDevice from '../drivers/vento-expert/device';
import { Device } from './__mocks__/homey';
import { statusResponse } from './__mockdata__/statusResponse';
import VentoDriver from '../drivers/vento-expert/driver';

jest.mock('blaubergventojs', () => ({
  ...jest.requireActual('blaubergventojs'),
  BlaubergVentoClient: class BlaubergVentoClient {
    send = jest.fn().mockResolvedValue(statusResponse);
  },
}));

function getDevice() {
  const device = new VentoDevice();
  device.driver = new VentoDriver();
  // @ts-expect-error: mock
  device.driver.deviceList = [];
  return device;
}

describe('ventoDevice', () => {
  it('should be able to get status from modbus on init', async () => {
    const device = getDevice();
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });

  it('should get and set values trough the api and modbus', async () => {
    const device = getDevice();
    await device.onInit();

    expect({
      // modbusCalls: (device.api.modbusClient.send as jest.Mock).mock.calls,
    }).toMatchSnapshot();
  });

  it('should be able to setup all capabilities', async () => {
    const device = getDevice();
    await device.setupCapabilities();

    expect({
      calls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });
});
