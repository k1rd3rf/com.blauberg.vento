// eslint-disable-next-line max-classes-per-file
import { Device } from './__mocks__/homey';
import { offResponse, statusResponse } from './__mockdata__/statusResponse';
import VentoDevice from './ventoDevice';
import { mapModbusResponse } from './mapModbusResponse';

const mockGetDeviceState = jest.fn(async () =>
  mapModbusResponse(statusResponse)
);
const mockSend = jest.fn();
jest.mock(
  './api',
  () =>
    class ApiMock extends jest.requireActual('./api').default {
      send = mockSend;
      getDeviceState = mockGetDeviceState;
    }
);

jest.mock(
  './ventoDiscovery',
  () =>
    class VentoDiscoveryMock {
      findById = jest.fn(async (id: string) => ({ id, ip: '127.0.0.3' }));
    }
);

describe('ventoDevice', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to get status from modbus on init', async () => {
    mockGetDeviceState.mockResolvedValue(mapModbusResponse(statusResponse));
    const device = new VentoDevice();
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
      getDeviceState: mockGetDeviceState.mock.calls,
      send: mockSend.mock.calls,
    }).toMatchSnapshot();
  });
  it('should be able to get status when device is marked as off', async () => {
    mockGetDeviceState.mockResolvedValue(mapModbusResponse(offResponse));
    const device = new VentoDevice();
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
      getDeviceState: mockGetDeviceState.mock.calls,
      send: mockSend.mock.calls,
    }).toMatchSnapshot();
  });
  it('should be able to handle errors', async () => {
    mockGetDeviceState.mockRejectedValue(new Error('test error'));
    const device = new VentoDevice();
    await device.onInit();

    expect({
      apiCalls: (device as unknown as Device).getMockCalls(),
      getDeviceState: mockGetDeviceState.mock.calls,
      send: mockSend.mock.calls,
    }).toMatchSnapshot();
  });

  it('should init the api', async () => {
    mockGetDeviceState.mockResolvedValue(mapModbusResponse(statusResponse));
    const device = new VentoDevice();
    await device.onInit();

    const { deviceId, devicePass, deviceIp } = device.api || {};

    expect({
      devicePass,
      deviceIp,
      deviceId,
    }).toMatchSnapshot();
  });

  it('should be able to setup all capabilities', async () => {
    mockGetDeviceState.mockResolvedValue(mapModbusResponse(statusResponse));
    const device = new VentoDevice();
    await device.setupCapabilities();

    expect({
      calls: (device as unknown as Device).getMockCalls(),
    }).toMatchSnapshot();
  });
});
