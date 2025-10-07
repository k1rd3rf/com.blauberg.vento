import VentoDevice from './ventoDevice';
import { Device } from './__mocks__/homey';
import { statusResponse, offResponse } from './__mockdata__/statusResponse';
import { sendMock } from './__mocks__/blaubergventojs';

jest.mock('./ventoDiscovery', () =>
  jest.fn().mockImplementation(() => ({
    findById: (id: string) => Promise.resolve({ id, ip: '127.0.0.2' }),
  }))
);

describe('ventoDevice', () => {
  afterEach(() => {
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
    const device = new VentoDevice();
    sendMock.mockResolvedValue(offResponse);
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });
  it('should be able to handle errors', async () => {
    const device = new VentoDevice();
    sendMock.mockRejectedValue(new Error('test errors'));

    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });

  it('should get and set values trough the api and modbus', async () => {
    const device = new VentoDevice();
    await device.onInit();

    expect({
      modbusCalls: sendMock.mock.calls,
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
