'use strict';

const { Device } = require('homey');
const {
  Capabilities,
  ActionCards,
  // eslint-disable-next-line node/no-missing-require
} = require('../../lib/capabilities');

class VentoDevice extends Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    const { id } = this.getData();
    this.log(`Locating device with id ${id}`);
    await this.discovery(id);
    await this.updateCapabilities();
    await this.setupCapabilities();
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
      this.registerCapabilityListener(
        Capabilities.onoff,
        this.onCapabilityOnOff.bind(this)
      );
    }
    if (this.hasCapability(Capabilities.speedMode)) {
      this.registerCapabilityListener(
        Capabilities.speedMode,
        this.onCapabilitySpeedMode.bind(this)
      );
      await this.setupFlowSpeedMode();
    }
    if (this.hasCapability(Capabilities.manualSpeed)) {
      this.registerCapabilityListener(
        Capabilities.manualSpeed,
        this.onCapabilityManualSpeed.bind(this)
      );
      await this.setupFlowManualSpeed();
    }
    if (this.hasCapability(Capabilities.fan_speed)) {
      this.registerCapabilityListener(
        Capabilities.fan_speed,
        this.onCapabilityFanSpeed.bind(this)
      );
    }
    if (this.hasCapability(Capabilities.operationMode)) {
      this.registerCapabilityListener(
        Capabilities.operationMode,
        this.onCapabilityOperationMode.bind(this)
      );
      await this.setupFlowOperationMode();
    }
    if (this.hasCapability(Capabilities.alarm_generic)) {
      this.homey.flow
        .getConditionCard(Capabilities.alarm_generic)
        .registerRunListener((args) => {
          return args.device.getCapabilityValue(Capabilities.alarm_generic);
        });
    }
    if (this.hasCapability(Capabilities.alarm_boost)) {
      this.homey.flow
        .getConditionCard(Capabilities.alarm_boost)
        .registerRunListener((args) => {
          return args.device.getCapabilityValue(Capabilities.alarm_boost);
        });
    }
    if (this.hasCapability(Capabilities.alarm_filter)) {
      this.homey.flow
        .getConditionCard(Capabilities.alarm_filter)
        .registerRunListener((args) => {
          return args.device.getCapabilityValue(Capabilities.alarm_filter);
        });
    }
    if (this.hasCapability(Capabilities.timerMode)) {
      this.registerCapabilityListener(
        Capabilities.timerMode,
        this.onCapabilityTimerMode.bind(this)
      );
      await this.setupFlowTimerMode();
    }
  }

  async discovery(id) {
    this.deviceObject = this.driver.locateDeviceById(id);
    if (this.deviceObject == null) {
      // Try to use last known IP if discovery failed
      const lastKnownIP = this.getStoreValue('lastKnownIP');
      if (lastKnownIP && lastKnownIP !== '0.0.0.0') {
        this.log(
          `Discovery failed, attempting to use last known IP: ${lastKnownIP}`
        );
        this.deviceObject = {
          id,
          ip: lastKnownIP,
        };
        // Test if device responds at this IP
        try {
          this.devicepwd = await this.getSetting('devicepwd');
          const state = await this.driver.getDeviceState(
            this.deviceObject,
            this.devicepwd
          );
          if (state) {
            await this.setAvailable();
            this.log(
              `Vento device reconnected using last known IP: [${lastKnownIP}]`
            );
            return;
          }
        } catch (error) {
          this.log(`Failed to connect using last known IP: ${error.message}`);
        }
      }
      await this.setUnavailable('Device not discovered yet');
      this.log('Vento device could not be located');
    } else {
      await this.setAvailable();
      this.log(`Vento device has been initialized: [${this.deviceObject.ip}]`);
      this.devicepwd = await this.getSetting('devicepwd');
      // Store IP address for future fallback
      await this.setStoreValue('lastKnownIP', this.deviceObject.ip);
      await this.setSettings({ last_known_ip: this.deviceObject.ip });
    }
  }

  async updateDeviceState() {
    this.log('Requesting the current device state');
    const state = await this.driver
      .getDeviceState(this.deviceObject, this.devicepwd)
      .catch(async (e) => {
        await this.setCapabilityValue(Capabilities.alarm_connectivity, true);
        await this.setUnavailable(e.message);
      });

    if (state === undefined || Object.keys(state).length === 0) {
      this.error('Failed to get device state, device unreachable');
      return;
    }

    this.log('Device state received: ', state);

    const currentStoredIP = this.getStoreValue('lastKnownIP');
    if (this.deviceObject?.ip && currentStoredIP !== this.deviceObject.ip) {
      this.log(
        `Device IP changed from ${currentStoredIP} to ${this.deviceObject.ip}`
      );
      await this.setStoreValue('lastKnownIP', this.deviceObject.ip);
      await this.setSettings({ last_known_ip: this.deviceObject.ip });
    }
    await this.setCapabilityValue(Capabilities.alarm_connectivity, false);
    await this.setAvailable();

    const newBoost = state.boost?.mode !== 0;
    const oldBoost = this.getCapabilityValue(Capabilities.alarm_boost);
    await this.setCapabilityValue(Capabilities.alarm_boost, newBoost);
    if (oldBoost !== null && oldBoost !== newBoost) {
      await this.triggerBoostAlarm(newBoost);
    }

    const oldFilter = this.getCapabilityValue(Capabilities.alarm_filter);
    const newFilter = state.filter?.alarm === 1;
    await this.setCapabilityValue(Capabilities.alarm_filter, newFilter);
    if (oldFilter !== null && oldFilter !== newFilter) {
      await this.triggerFilterAlarm(newFilter);
    }

    const oldGeneric = this.getCapabilityValue(Capabilities.alarm_generic);
    const newGeneric = state.alarm !== 0;
    await this.setCapabilityValue(Capabilities.alarm_generic, newGeneric);
    if (oldGeneric !== null && oldGeneric !== newGeneric) {
      await this.triggerGenericAlarm(newGeneric);
    }

    await this.setCapabilityValue(Capabilities.onoff, state.onoff === 1);
    await this.setCapabilityValue(
      Capabilities.filter_timer,
      `${state.filter?.timer.days}:${state.filter?.timer.hour}:${state.filter?.timer.min}`
    );
    await this.setCapabilityValue(
      Capabilities.measure_humidity,
      state.humidity?.current
    );
    await this.setCapabilityValue(Capabilities.measure_RPM, state.fan?.rpm);
    // Now handle the different modes
    await this.setCapabilityValue(
      Capabilities.speedMode,
      state.speed?.mode?.toString()
    );
    await this.setCapabilityValue(
      Capabilities.manualSpeed,
      (state.speed?.manualspeed / 255) * 100
    );
    await this.setCapabilityValue(
      Capabilities.fan_speed,
      state.speed?.manualspeed / 255
    );
    await this.setCapabilityValue(
      Capabilities.operationMode,
      state.operationmode?.toString()
    );
    await this.setCapabilityValue(
      Capabilities.timerMode,
      state.timers?.mode?.toString()
    );
    await this.setCapabilityValue(
      Capabilities.timerMode_timer,
      `${state.timers?.countdown?.hour}:${state.timers?.countdown?.min}:${state.timers?.countdown?.sec}`
    );

    const settingsOnDevice = {
      devicemodel: state.unittype,
      humidity_sensor: state.humidity?.sensoractivation === 1,
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

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('devicepwd')) {
      this.devicepwd = newSettings.devicepwd;
      await this.updateDeviceState();
    }
    if (changedKeys.includes('last_known_ip')) {
      await this.setStoreValue('lastKnowIP', newSettings.last_known_ip);
    }
    // For the other settings we probably need to push the new value to the device
    if (changedKeys.includes('humidity_sensor')) {
      await this.driver.setHumiditySensor(
        this.deviceObject,
        this.devicepwd,
        newSettings.humidity_sensor
      );
    }
    if (changedKeys.includes('humidity_threshold')) {
      await this.driver.setHumiditySensorThreshold(
        this.deviceObject,
        this.devicepwd,
        newSettings.humidity_threshold
      );
    }
    if (changedKeys.includes('boost_delay')) {
      await this.driver.setBoostDelay(
        this.deviceObject,
        this.devicepwd,
        newSettings.boost_delay
      );
    }
  }

  onCapabilityOnOff = async (value) => {
    if (value) {
      await this.driver.setOnOffStatus(this.deviceObject, this.devicepwd, 1);
    } else {
      await this.driver.setOnOffStatus(this.deviceObject, this.devicepwd, 0);
    }
  };

  onCapabilitySpeedMode = async (value) => {
    await this.driver.setSpeedMode(this.deviceObject, this.devicepwd, value);
  };

  onCapabilityManualSpeed = async (value) => {
    await this.driver.setManualSpeed(
      this.deviceObject,
      this.devicepwd,
      255 * (value / 100)
    );
  };

  onCapabilityFanSpeed = async (value) => {
    await this.driver.setManualSpeed(
      this.deviceObject,
      this.devicepwd,
      255 * value
    );
  };

  onCapabilityOperationMode = async (value) => {
    await this.driver.setOperationMode(
      this.deviceObject,
      this.devicepwd,
      value
    );
  };

  onCapabilityTimerMode = async (value) => {
    await this.driver.setTimerMode(this.deviceObject, this.devicepwd, value);
  };

  async setupFlowOperationMode() {
    this.log('Create the flow for the operation mode capability');
    this.homey.flow
      .getActionCard(ActionCards.operation_mode)
      .registerRunListener(async (args) => {
        this.log(`attempt to change operation mode: ${args.operationMode}`);
        await this.setCapabilityValue(
          Capabilities.operationMode,
          args.operationMode
        );
        await this.driver.setOperationMode(
          args.device.deviceObject,
          args.device.devicepwd,
          args.operationMode
        );
      });
  }

  async setupFlowSpeedMode() {
    this.log('Create the flow for the speed mode capability');
    this.homey.flow
      .getActionCard(ActionCards.speed_mode)
      .registerRunListener(async (args) => {
        this.log(`attempt to change speed mode: ${args.speedMode}`);
        await this.setCapabilityValue(Capabilities.speedMode, args.speedMode);
        await this.driver.setSpeedMode(
          args.device.deviceObject,
          args.device.devicepwd,
          args.speedMode
        );
      });
  }

  async setupFlowManualSpeed() {
    this.log('Create the flow for the manual speed capability');
    this.homey.flow
      .getActionCard(ActionCards.manualSpeed_set)
      .registerRunListener(async (args) => {
        this.log(`attempt to change manual speed: ${args.speed}`);
        await this.setCapabilityValue(Capabilities.manualSpeed, args.speed);
        await this.setCapabilityValue(
          Capabilities.fan_speed,
          args.speed / 100 - 1
        );
        await this.driver.setManualSpeed(
          args.device.deviceObject,
          args.device.devicepwd,
          255 * (args.speed / 100)
        );
      });
  }

  async setupFlowTimerMode() {
    this.log('Create the flow for the timer mode capability');
    this.homey.flow
      .getActionCard(ActionCards.timer_mode)
      .registerRunListener(async (args) => {
        this.log(`attempt to change timer mode: ${args.timerMode}`);
        await this.setCapabilityValue(Capabilities.timerMode, args.timerMode);
        await this.driver.setTimerMode(
          args.device.deviceObject,
          args.device.devicepwd,
          args.timerMode
        );
      });
  }

  async triggerBoostAlarm(isOn) {
    const triggerCard = isOn ? 'alarm_boost_true' : 'alarm_boost_false';
    this.log(`Triggering ${triggerCard}`);
    await this.homey.flow
      .getDeviceTriggerCard(triggerCard)
      .trigger(this, {}, {});
  }

  async triggerFilterAlarm(isOn) {
    const triggerCard = isOn ? 'alarm_filter_true' : 'alarm_filter_false';
    this.log(`Triggering ${triggerCard}`);
    await this.homey.flow
      .getDeviceTriggerCard(triggerCard)
      .trigger(this, {}, {});
  }

  async triggerGenericAlarm(isOn) {
    const triggerCard = isOn ? 'alarm_generic_true' : 'alarm_generic_false';
    this.log(`Triggering ${triggerCard}`);
    await this.homey.flow
      .getDeviceTriggerCard(triggerCard)
      .trigger(this, {}, {});
  }
}

module.exports = VentoDevice;
