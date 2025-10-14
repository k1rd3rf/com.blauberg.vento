// eslint-disable-next-line max-classes-per-file
import { callsWithArgs, callCount, removeUndefinedDeep } from '../testTools';

class FlowCard {
  capability: string;
  // eslint-disable-next-line no-use-before-define
  device: Device;

  // eslint-disable-next-line no-use-before-define
  constructor(capability: string, device: Device) {
    this.capability = capability;
    this.device = device;
  }

  registerRunListener = (fn: (value: unknown) => Promise<void>) => {
    this.device.capabilities[this.capability] = fn;

    this.device.registerRunListenerMock(this.capability, fn);
    return Promise.resolve({
      device: this.device,
      capability: this.capability,
      [this.capability]: this.device.capabilityValue[this.capability],
    });
  };

  trigger = (...args: object[]) => {
    const [, ...rest] = args;
    this.device.triggerMock(this.capability, ['deviceObject', ...rest]);
    return Promise.resolve(true);
  };
}

// eslint-disable-next-line import/prefer-default-export
export class Device {
  setCapabilityValueMock = jest.fn();
  hasCapabilityMock = jest.fn().mockReturnValue(true);
  registerCapabilityListenerMock = jest.fn().mockReturnValue(true);
  registerRunListenerMock = jest.fn();
  getCapabilityValueMock = jest.fn();
  triggerMock = jest.fn();

  logMock = jest.fn();

  capabilities: Record<string, (value: unknown) => Promise<void>> = {};
  capabilityValue: Record<string, unknown> = {};

  homey = {
    flow: {
      getActionCard: (capability: string) => new FlowCard(capability, this),
      getConditionCard: (capability: string) => new FlowCard(capability, this),
      getDeviceTriggerCard: (capability: string) =>
        new FlowCard(capability, this),
    },
    setInterval: jest.fn(),
  };

  settings: Record<string, unknown> = {
    devicepwd: 'password',
  };

  store: Record<string, unknown> = {};

  log = (...args: unknown[]) => this.logMock('log', ...args);
  error = (...args: unknown[]) => this.logMock('error', ...args);

  getData() {
    return { id: 'TEST1234' };
  }

  async setCapabilityValue(capabilityId: string, value: unknown) {
    const fn = this.capabilities[capabilityId];
    this.capabilityValue[capabilityId] = value;
    if (fn) {
      const result = await fn({ value, device: this });
      return this.setCapabilityValueMock(capabilityId, value, { result });
    }
    return this.setCapabilityValueMock(
      capabilityId,
      value,
      'calling unregistered capability'
    );
  }

  getCapabilityValue(capabilityId: string) {
    this.getCapabilityValueMock(capabilityId);
    return this.capabilityValue[capabilityId];
  }

  async hasCapability(capabilityId: string) {
    this.hasCapabilityMock(capabilityId);
    return !!this.capabilities[capabilityId];
  }

  async setStoreValue(key: string, value: unknown) {
    this.store[key] = value;
  }

  getStoreValue(key: string) {
    return this.store[key];
  }

  async registerCapabilityListener(
    rId: string,
    callback: (value: unknown) => Promise<void>
  ) {
    this.capabilities[rId] = callback;
    return this.registerCapabilityListenerMock(rId, callback);
  }

  getSetting(key: string) {
    return this.settings[key];
  }

  setSettings(settings: object) {
    // eslint-disable-next-line no-return-assign
    return (this.settings = { ...this.settings, ...settings });
  }

  async setUnavailable(reason?: string) {
    this.logMock('setUnavailable was called', reason);
  }

  async setAvailable(reason?: string) {
    this.logMock('setAvailable', reason);
  }

  getAvailable() {
    return true;
  }

  getMockCalls = () => {
    const calls = removeUndefinedDeep({
      setCapabilityValue: callsWithArgs(this.setCapabilityValueMock.mock.calls),
      hasCapability: callCount(this.hasCapabilityMock.mock.calls),
      registerCapabilityListener: callCount(
        this.registerCapabilityListenerMock.mock.calls
      ),
      registerRunListener: callsWithArgs(
        this.registerRunListenerMock.mock.calls
      ),
      getCapabilityValue: callCount(this.getCapabilityValueMock.mock.calls),
      trigger: callsWithArgs(this.triggerMock.mock.calls),
      log: this.logMock.mock.calls,
      settings: this.settings,
      capabilities: this.capabilities,
      store: this.store,
    });
    [
      this.setCapabilityValueMock,
      this.hasCapabilityMock,
      this.registerCapabilityListenerMock,
      this.registerRunListenerMock,
      this.getCapabilityValueMock,
      this.logMock,
      this.triggerMock,
    ].forEach((m) => m.mockClear());

    this.settings = {};
    return calls;
  };
}

export class Driver {
  homey = {
    setInterval: jest.fn(),
  };
}
