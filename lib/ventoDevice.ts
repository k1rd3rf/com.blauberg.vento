import { Device } from 'homey';
import Api from './api';
import VentoDiscovery from './ventoDiscovery';

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

    async updateCapabilities() {
      if (!this.hasCapability('fan_speed')) {
        await this.addCapability('fan_speed');
      }
      if (!this.hasCapability('alarm_connectivity')) {
        await this.addCapability('alarm_connectivity');
      }
    }

    async setupCapabilities() {
      if (this.hasCapability('onoff')) {
        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
      }
      if (this.hasCapability('speedMode')) {
        this.registerCapabilityListener('speedMode', this.onCapabilitySpeedmode.bind(this));
        await this.setupFlowSpeedMode();
      }
      if (this.hasCapability('manualSpeed')) {
        this.registerCapabilityListener('manualSpeed', this.onCapabilityManualSpeed.bind(this));
        await this.setupFlowManualSpeed();
      }
      if (this.hasCapability('fan_speed')) {
        this.registerCapabilityListener('fan_speed', this.onCapabilityFanSpeed.bind(this));
      }
      if (this.hasCapability('operationMode')) {
        this.registerCapabilityListener('operationMode', this.onCapabilityOperationMode.bind(this));
        await this.setupFlowOperationMode();
      }
      if (this.hasCapability('alarm_generic')) {
        this.homey.flow.getConditionCard('alarm_generic').registerRunListener((args) => {
          return args.device.getCapabilityValue('alarm_generic');
        });
      }
      if (this.hasCapability('alarm_boost')) {
        this.homey.flow.getConditionCard('alarm_boost').registerRunListener((args) => {
          return args.device.getCapabilityValue('alarm_boost');
        });
      }
      if (this.hasCapability('alarm_filter')) {
        this.homey.flow.getConditionCard('alarm_filter').registerRunListener((args) => {
          return args.device.getCapabilityValue('alarm_filter');
        });
      }
      if (this.hasCapability('timerMode')) {
        this.registerCapabilityListener('timerMode', this.onCapabilityTimerMode.bind(this));
        await this.setupFlowTimerMode();
      }
    }

    async updateDeviceState() {
      this.log('Requesting the current device state');
      const state = await this.api.getDeviceState().catch(async () => {
        await this.setCapabilityValue('alarm_connectivity', true);
      });
      if (state === undefined) {
        return;
      }
      await this.setCapabilityValue('alarm_connectivity', false);
      this.log(JSON.stringify(state));
      await this.setCapabilityValue('onoff', (state.onoff === 1));
      await this.setCapabilityValue('alarm_boost', (state.boost.mode !== 0));
      await this.setCapabilityValue('alarm_filter', (state.filter.alarm === 1));
      await this.setCapabilityValue('filter_timer', `${state.filter.timer.days}:${state.filter.timer.hour}:${state.filter.timer.min}`);
      await this.setCapabilityValue('alarm_generic', (state.alarm !== 0));
      await this.setCapabilityValue('measure_humidity', state.humidity.current);
      await this.setCapabilityValue('measure_RPM', state.fan.rpm);
      // Now handle the different modes
      await this.setCapabilityValue('speedMode', state.speed.mode.toString());
      await this.setCapabilityValue('manualSpeed', (state.speed.manualspeed / 255) * 100);
      await this.setCapabilityValue('fan_speed', (state.speed.manualspeed / 255));
      await this.setCapabilityValue('operationMode', state.operationmode.toString());
      await this.setCapabilityValue('timerMode', state.timers.mode.toString());
      await this.setCapabilityValue('timerMode_timer', `${state.timers.countdown.hour}:${state.timers.countdown.min}:${state.timers.countdown.sec}`);

      // Update our settings based on current values in the device
      await this.setSettings({
        // only provide keys for the settings you want to change
        devicemodel: state.unittype,
        humidity_sensor: (state.humidity.sensoractivation === 1),
        humidity_threshold: state.humidity.threshold,
        boost_delay: state.boost.deactivationtimer,
      });
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
      this.log('Vento device has been added');
    }

    async onSettings({ newSettings, changedKeys }) {
      if (changedKeys.includes('devicepwd')) {
        await this.initApi(newSettings.devicepwd);
        await this.updateDeviceState();
      }
      // For the other settings we probably need to push the new value to the device
      if (changedKeys.includes('humidity_sensor')) {
        await this.api.setHumiditySensor(newSettings.humidity_sensor);
      }
      if (changedKeys.includes('humidity_threshold')) {
        await this.api.setHumiditySensorThreshold(newSettings.humidity_threshold);
      }
      if (changedKeys.includes('boost_delay')) {
        await this.api.setBoostDelay(newSettings.boost_delay);
      }
    }

    async onCapabilityOnoff(value, opts) {
      if (value) {
        await this.api.setOnOffStatus(1);
      } else {
        await this.api.setOnOffStatus(0);
      }
      // this.setCapabilityValue('onoff', value);
    }

    async onCapabilitySpeedmode(value, opts) {
      await this.api.setSpeedMode(value);
    }

    async onCapabilityManualSpeed(value, opts) {
      await this.api.setManualSpeed((255 * (value / 100)));
    }

    onCapabilityFanSpeed: Device.CapabilityCallback = async (value, opts) => {
      await this.api.setManualSpeed((255 * value));
    };

    async onCapabilityOperationMode(value, opts) {
      await this.api.setOperationMode(value);
    }

    async onCapabilityTimerMode(value, opts) {
      await this.api.setTimerMode(value);
    }

    async setupFlowOperationMode() {
      this.log('Create the flow for the operation mode capability');
      this.homey.flow.getActionCard('operation_mode')
        .registerRunListener(async (args, state) => {
          this.log(`attempt to change operation mode: ${args.operationMode}`);
          await this.setCapabilityValue('operationMode', args.operationMode);
          await this.api.setOperationMode(args.operationMode);
        });
    }

    async setupFlowSpeedMode() {
      this.log('Create the flow for the speed mode capability');
      this.homey.flow.getActionCard('speed_mode')
        .registerRunListener(async (args, state) => {
          this.log(`attempt to change speed mode: ${args.speedMode}`);
          await this.setCapabilityValue('speedMode', args.speedMode);
          await this.api.setSpeedMode(args.speedMode);
        });
    }

    async setupFlowManualSpeed() {
      this.log('Create the flow for the manual speed capability');
      // Now setup the flow cards
      this.homey.flow.getActionCard('manualSpeed_set')
        .registerRunListener(async (args, state) => {
          this.log(`attempt to change manual speed: ${args.speed}`);
          await this.setCapabilityValue('manualSpeed', args.speed);
          await this.setCapabilityValue('fan_speed', ((args.speed / 100) - 1));
          await this.api.setManualSpeed((255 * (args.speed / 100)));
        });
    }

    async setupFlowTimerMode() {
      this.log('Create the flow for the timer mode capability');
      this.homey.flow.getActionCard('timer_mode')
        .registerRunListener(async (args, state) => {
          this.log(`attempt to change timer mode: ${args.timerMode}`);
          await this.setCapabilityValue('timerMode', args.timerMode);
          await this.api.setTimerMode(args.timerMode);
        });
    }
}
