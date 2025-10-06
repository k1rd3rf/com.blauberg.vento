import { DeviceAddress } from 'blaubergventojs';
import Api from '../drivers/vento-expert/driver';
import { statusResponse } from './__mockdata__/statusResponse';
import { removeUndefinedDeep } from './testTools';
import mapModbusResponse from './mapModbusResponse';

describe('Api set functions', () => {
  let api: Api;

  beforeEach(() => {
    jest.spyOn(global.console, 'error');
    api = new Api();
    api.modbusClient = {
      timeout: 0,
      findDevices(): Promise<DeviceAddress[]> {
        return Promise.resolve([]);
      },
      // @ts-expect-error: mock
      send: jest.fn((packet, ip) => Promise.resolve({ packet, ip })),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMockCalls = (response: any) => ({
    calls: (api.modbusClient?.send as jest.Mock).mock.calls,
    response: removeUndefinedDeep(response),
  });
  const device = { id: 'fanId', ip: '127.0.0.1' };

  it('update sends correct data', async () => {
    const response = await api.getDeviceState(device, 'password');
    expect(getMockCalls(response)).toMatchSnapshot();
  });
  it('update gets response', async () => {
    (api.modbusClient?.send as jest.Mock).mockReturnValue(
      Promise.resolve(statusResponse)
    );
    const response = await api.getDeviceState(device, 'password');
    expect(getMockCalls(response)).toMatchSnapshot();
  });

  [0, 1, 2].forEach((value) => {
    it(`setOnOffStatus sends value ${value}`, async () => {
      const response = await api.setOnOffStatus(device, 'password', value);
      expect(getMockCalls(response)).toMatchSnapshot();
    });
    it(`setSpeedMode sends value ${value}`, async () => {
      const response = await api.setSpeedMode(device, 'password', value);
      expect(getMockCalls(response)).toMatchSnapshot();
    });
    it(`setOperationMode sends value ${value}`, async () => {
      const response = await api.setOperationMode(device, 'password', value);
      expect(getMockCalls(response)).toMatchSnapshot();
    });
    it(`setTimerMode sends value ${value}`, async () => {
      const response = await api.setTimerMode(device, 'password', value);
      expect(getMockCalls(response)).toMatchSnapshot();
    });
    it(`setManualSpeed sends value ${value}`, async () => {
      const response = await api.setManualSpeed(device, 'password', value);
      expect(getMockCalls(response)).toMatchSnapshot();
    });
    it(`setHumiditySensor sends value ${value}`, async () => {
      const response = await api.setHumiditySensor(device, 'password', value);
      expect(getMockCalls(response)).toMatchSnapshot();
    });
    it(`setHumiditySensorThreshold sends value ${value}`, async () => {
      const response = await api.setHumiditySensorThreshold(
        device,
        'password',
        value
      );
      expect(getMockCalls(response)).toMatchSnapshot();
    });
    it(`setBoostDelay sends value ${value}`, async () => {
      const response = await api.setBoostDelay(device, 'password', value);
      expect(getMockCalls(response)).toMatchSnapshot();
    });
  });
});
