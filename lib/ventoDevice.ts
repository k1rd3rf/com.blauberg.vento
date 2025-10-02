import { Device } from 'homey';
import Api from './api';
import VentoDiscovery from './ventoDiscovery';
import { Capabilities, ActionCards } from './capabilities';

type DeviceSettings = {
    devicemodel?: string;
    devicepwd: string;
    // eslint-disable-next-line camelcase
    humidity_sensor: boolean
    // eslint-disable-next-line camelcase
    humidity_threshold?: number
    // eslint-disable-next-line camelcase
    boost_delay?: number
};

export default class VentoDevice extends Device {
    id!: string
    api!: Api

    discoveryClient!: VentoDiscovery

    private pollInterval: NodeJS.Timeout | undefined;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
      const { id } = this.getData();
      this.id = id;
      this.log(`Locating device with id ${id}`);

      await this.updateCapabilities();
      await this.setupCapabilities();
      this.discoveryClient = new VentoDiscovery();

      await this.initApi(this.getSetting('devicepwd'));

      this.pollInterval = this.homey.setInterval(() => this.updateDeviceState(), 15000);

      await this.updateDeviceState();
    }

    async initApi(password: string) {
      const deviceIp = await this.discoveryClient.findById(this.id).then((d) => d?.ip);

      if (deviceIp == null) {
        this.log('Device IP could not be found, setting device to unavailable');
        await this.setUnavailable('Device not discovered yet');
      } else {
        this.api = new Api(this.id, password, deviceIp);
      }
    }

    onUninit(): Promise<void> {
      this.homey.clearInterval(this.pollInterval);
      return super.onUninit();
    }

    async updateCapabilities() {
      if (!this.hasCapability(Capabilities.fan_speed)) {
        await this.addCapability(Capabilities.fan_speed);
      }
      if (!this.hasCapability(Capabilities.alarm_connectivity)) {
        await this.addCapability(Capabilities.alarm_connectivity);
      }
    }

    async setupCapabilities() {
      if (this.hasCapability(Capabilities.onoff)) {
        this.registerCapabilityListener(Capabilities.onoff, this.onCapabilityOnOff.bind(this));
      }
      if (this.hasCapability(Capabilities.speedMode)) {
        this.registerCapabilityListener(Capabilities.speedMode, this.onCapabilitySpeedMode.bind(this));
        await this.setupFlowSpeedMode();
      }
      if (this.hasCapability(Capabilities.manualSpeed)) {
        this.registerCapabilityListener(Capabilities.manualSpeed, this.onCapabilityManualSpeed.bind(this));
        await this.setupFlowManualSpeed();
      }
      if (this.hasCapability(Capabilities.fan_speed)) {
        this.registerCapabilityListener(Capabilities.fan_speed, this.onCapabilityFanSpeed.bind(this));
      }
      if (this.hasCapability(Capabilities.operationMode)) {
        this.registerCapabilityListener(Capabilities.operationMode, this.onCapabilityOperationMode.bind(this));
        await this.setupFlowOperationMode();
      }
      if (this.hasCapability(Capabilities.alarm_generic)) {
        this.homey.flow.getConditionCard(Capabilities.alarm_generic).registerRunListener((args) => {
          return args.device.getCapabilityValue(Capabilities.alarm_generic);
        });
      }
      if (this.hasCapability(Capabilities.alarm_boost)) {
        this.homey.flow.getConditionCard(Capabilities.alarm_boost).registerRunListener((args) => {
          return args.device.getCapabilityValue(Capabilities.alarm_boost);
        });
      }
      if (this.hasCapability(Capabilities.alarm_filter)) {
        this.homey.flow.getConditionCard(Capabilities.alarm_filter).registerRunListener((args) => {
          return args.device.getCapabilityValue(Capabilities.alarm_filter);
        });
      }
      if (this.hasCapability(Capabilities.timerMode)) {
        this.registerCapabilityListener(Capabilities.timerMode, this.onCapabilityTimerMode.bind(this));
        await this.setupFlowTimerMode();
      }
    }

    async updateDeviceState() {
      this.log('Requesting the current device state');
      const state = await this.api.getDeviceState().catch(async (e) => {
        await this.setCapabilityValue(Capabilities.alarm_connectivity, true);
        await this.setUnavailable();
        this.error('Failed to get device state, device unreachable', e);
      });
      if (state === undefined) {
        return;
      }

      this.log('Device state received: ', state);

      await this.setAvailable();
      await this.setCapabilityValue(Capabilities.alarm_connectivity, false);
      await this.setCapabilityValue(Capabilities.onoff, (state.onoff === 1));
      await this.setCapabilityValue(Capabilities.alarm_boost, (state.boost?.mode !== 0));
      await this.setCapabilityValue(Capabilities.alarm_filter, (state.filter?.alarm === 1));
      await this.setCapabilityValue(Capabilities.filter_timer, `${state.filter?.timer.days}:${state.filter?.timer.hour}:${state.filter?.timer.min}`);
      await this.setCapabilityValue(Capabilities.alarm_generic, (state.alarm !== 0));
      await this.setCapabilityValue(Capabilities.measure_humidity, state.humidity?.current);
      await this.setCapabilityValue(Capabilities.measure_RPM, state.fan?.rpm);
      // Now handle the different modes
      await this.setCapabilityValue(Capabilities.speedMode, state.speed?.mode?.toString());
      await this.setCapabilityValue(Capabilities.manualSpeed, (state.speed?.manualspeed ?? -1 / 255) * 100);
      await this.setCapabilityValue(Capabilities.fan_speed, (state.speed?.manualspeed ?? -1 / 255));
      await this.setCapabilityValue(Capabilities.operationMode, state.operationmode?.toString());
      await this.setCapabilityValue(Capabilities.timerMode, state.timers?.mode?.toString());
      await this.setCapabilityValue(Capabilities.timerMode_timer, `${state.timers?.countdown?.hour}:${state.timers?.countdown?.min}:${state.timers?.countdown?.sec}`);

      const settingsOnDevice: Partial<DeviceSettings> = {
        devicemodel: state.unittype,
        humidity_sensor: (state.humidity?.sensoractivation === 1),
        humidity_threshold: state.humidity?.threshold,
        boost_delay: state.boost?.deactivationtimer,
      };
      await this.setSettings(settingsOnDevice);
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    onAdded() {
      this.log('Vento device has been added');
    }

    async onSettings({ newSettings, changedKeys }: {
        oldSettings: DeviceSettings;
        newSettings: DeviceSettings;
        changedKeys: (keyof DeviceSettings)[];
    }) {
      if (changedKeys.includes('devicepwd')) {
        await this.initApi(newSettings.devicepwd);
        await this.updateDeviceState();
      }
      // For the other settings we probably need to push the new value to the device
      if (changedKeys.includes('humidity_sensor')) {
        await this.api.setHumiditySensor(newSettings.humidity_sensor ? 1 : 0);
      }
      if (changedKeys.includes('humidity_threshold') && newSettings.humidity_threshold) {
        await this.api.setHumiditySensorThreshold(newSettings.humidity_threshold);
      }
      if (changedKeys.includes('boost_delay') && newSettings.boost_delay) {
        await this.api.setBoostDelay(newSettings.boost_delay);
      }
    }

    onCapabilityOnOff: Device.CapabilityCallback = async (value) => {
      if (value) {
        await this.api.setOnOffStatus(1);
      } else {
        await this.api.setOnOffStatus(0);
      }
    };

    onCapabilitySpeedMode: Device.CapabilityCallback = async (value) => {
      await this.api.setSpeedMode(value);
    };

    onCapabilityManualSpeed: Device.CapabilityCallback = async (value) => {
      await this.api.setManualSpeed((255 * (value / 100)));
    };

    onCapabilityFanSpeed: Device.CapabilityCallback = async (value) => {
      await this.api.setManualSpeed((255 * value));
    };

    onCapabilityOperationMode: Device.CapabilityCallback = async (value) => {
      await this.api.setOperationMode(value);
    };

    onCapabilityTimerMode: Device.CapabilityCallback = async (value) => {
      await this.api.setTimerMode(value);
    };

    async setupFlowOperationMode() {
      this.log('Create the flow for the operation mode capability');
      this.homey.flow.getActionCard(ActionCards.operation_mode)
        .registerRunListener(async (args: { operationMode: number }) => {
          this.log(`attempt to change operation mode: ${args.operationMode}`);
          await this.setCapabilityValue(Capabilities.operationMode, args.operationMode);
          await this.api.setOperationMode(args.operationMode);
        });
    }

    async setupFlowSpeedMode() {
      this.log('Create the flow for the speed mode capability');
      this.homey.flow.getActionCard(ActionCards.speed_mode)
        .registerRunListener(async (args: { speedMode: number }) => {
          this.log(`attempt to change speed mode: ${args.speedMode}`);
          await this.setCapabilityValue(Capabilities.speedMode, args.speedMode);
          await this.api.setSpeedMode(args.speedMode);
        });
    }

    async setupFlowManualSpeed() {
      this.log('Create the flow for the manual speed capability');
      this.homey.flow.getActionCard(ActionCards.manualSpeed_set)
        .registerRunListener(async (args: { speed: number }) => {
          this.log(`attempt to change manual speed: ${args.speed}`);
          await this.setCapabilityValue(Capabilities.manualSpeed, args.speed);
          await this.setCapabilityValue(Capabilities.fan_speed, ((args.speed / 100) - 1));
          await this.api.setManualSpeed((255 * (args.speed / 100)));
        });
    }

    async setupFlowTimerMode() {
      this.log('Create the flow for the timer mode capability');
      this.homey.flow.getActionCard(ActionCards.timer_mode)
        .registerRunListener(async (args: { timerMode: number }) => {
          this.log(`attempt to change timer mode: ${args.timerMode}`);
          await this.setCapabilityValue(Capabilities.timerMode, args.timerMode);
          await this.api.setTimerMode(args.timerMode);
        });
    }
}
