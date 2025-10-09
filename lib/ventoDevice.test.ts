import VentoDevice from './ventoDevice';
import { Device } from './__mocks__/homey';
import { statusResponse, offResponse } from './__mockdata__/statusResponse';
import { sendMock } from './__mocks__/blaubergventojs';

describe('ventoDevice', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    sendMock.mockResolvedValue(statusResponse);
  });

  it('should be able to get status from modbus on init', async () => {
    const device = new VentoDevice();
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });
  it('should be able to get status when device is marked as off', async () => {
    sendMock.mockResolvedValue(offResponse);
    const device = new VentoDevice();
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });
  it('should be able to handle errors', async () => {
    sendMock.mockRejectedValue(new Error('test error'));
    const device = new VentoDevice();
    const error = await device.onInit().catch((e) => e);

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
      error,
    }).toMatchSnapshot();
  });

  it('should get and set values trough the api and modbus', async () => {
    const device = new VentoDevice();
    await device.onInit();

    expect({
      modbusCalls: (sendMock as jest.Mock).mock.calls,
    }).toMatchSnapshot();
  });

  it('should init the api', async () => {
    const device = new VentoDevice();
    await device.onInit();

    const { deviceId, devicePass, deviceIp } = device.api || {};
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
