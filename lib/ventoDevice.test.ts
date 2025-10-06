import VentoDevice from '../drivers/vento-expert/device';
import { Device } from './__mocks__/homey';
import { statusResponse } from './__mockdata__/statusResponse';
import VentoDriver from '../drivers/vento-expert/driver';

jest.mock('blaubergventojs', () => ({
  ...jest.requireActual('blaubergventojs'),
  BlaubergVentoClient: class BlaubergVentoClient {
    send = jest.fn().mockResolvedValue(statusResponse);
    findDevices = jest
      .fn()
      .mockResolvedValue([{ id: 'TEST1234', ip: '127.0.0.3' }]);
  },
}));

async function getDevice() {
  const device = new VentoDevice();
  device.driver = new VentoDriver();
  await device.driver.onInit();
  // @ts-expect-error: mock
  device.driver.deviceList = [{ id: 'TEST1234', ip: '127.0.0.2' }];
  device.driver.getDevices = () => [device];
  return device;
}

describe('ventoDevice', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to get status from modbus on init', async () => {
    const device = await getDevice();
    await device.onInit();
    await device.updateDeviceState();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });

  it('should get and set values trough the api and modbus', async () => {
    const device = await getDevice();
    await device.onInit();
    // @ts-expect-error: call manually
    await device.driver.locateDevices();

    expect({
      // @ts-expect-error: mock
      modbusCalls: (device.driver.modbusClient.send as jest.Mock).mock.calls,
    }).toMatchSnapshot();
  });

  it('should be able to setup all capabilities', async () => {
    const device = await getDevice();

    expect({
      calls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });
});
