'use strict';

const { Driver } = require('homey');
const {
  BlaubergVentoClient,
  Packet,
  FunctionType,
  Parameter,
  DataEntry,
} = require('blaubergventojs');
// eslint-disable-next-line node/no-missing-require
const mapModbusResponse = require('../../lib/mapModbusResponse');

class VentoDriver extends Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.deviceList = [];
    this.modbusClient = new BlaubergVentoClient();
    this.modbusClient.timeout = 1500;
    this.log('Vento driver has been initialized');
    this.start_discover_loop();
  }

  // eslint-disable-next-line camelcase
  start_discover_loop() {
    this._timer = this.homey.setInterval(async () => {
      await this.locateDevices();
    }, 10000);
  }

  async setDeviceValue(device, devicepass, param, value) {
    const packet = new Packet(device.id, devicepass, FunctionType.WRITE, [
      DataEntry.of(param, value),
    ]);
    return this.modbusClient.send(packet, device.ip).then((result) => result);
  }

  async setOnoffStatus(device, devicepass, value) {
    return this.setDeviceValue(device, devicepass, Parameter.ON_OFF, value);
  }

  async setSpeedMode(device, devicepass, value) {
    return this.setDeviceValue(device, devicepass, Parameter.SPEED, value);
  }

  async setOperationMode(device, devicepass, value) {
    return this.setDeviceValue(
      device,
      devicepass,
      Parameter.VENTILATION_MODE,
      value
    );
  }

  async setTimerMode(device, devicepass, value) {
    return this.setDeviceValue(device, devicepass, Parameter.TIMER_MODE, value);
  }

  async setManualSpeed(device, devicepass, value) {
    return this.setDeviceValue(
      device,
      devicepass,
      Parameter.MANUAL_SPEED,
      value
    );
  }

  async setHumiditySensor(device, devicepass, value) {
    return this.setDeviceValue(
      device,
      devicepass,
      Parameter.HUMIDITY_SENSOR_ACTIVATION,
      value
    );
  }

  async setHumiditySensorThreshold(device, devicepass, value) {
    return this.setDeviceValue(
      device,
      devicepass,
      Parameter.HUMIDITY_THRESHOLD,
      value
    );
  }

  async setBoostDelay(device, devicepass, value) {
    return this.setDeviceValue(
      device,
      devicepass,
      Parameter.BOOST_MODE_DEACTIVATION_DELAY,
      value
    );
  }

  async getDeviceState(device, devicepass) {
    // Assemble package for reading ON_OFF state
    const packet = new Packet(device.id, devicepass, FunctionType.READ, [
      DataEntry.of(Parameter.ON_OFF),
      DataEntry.of(Parameter.SPEED),
      DataEntry.of(Parameter.MANUAL_SPEED),
      DataEntry.of(Parameter.BOOT_MODE),
      DataEntry.of(Parameter.BOOST_MODE_DEACTIVATION_DELAY),
      DataEntry.of(Parameter.VENTILATION_MODE),
      DataEntry.of(Parameter.FILTER_ALARM),
      DataEntry.of(Parameter.FILTER_TIMER),
      DataEntry.of(Parameter.CURRENT_HUMIDITY),
      DataEntry.of(Parameter.HUMIDITY_SENSOR_ACTIVATION),
      DataEntry.of(Parameter.HUMIDITY_THRESHOLD),
      DataEntry.of(Parameter.UNIT_TYPE),
      DataEntry.of(Parameter.FAN1RPM),
      DataEntry.of(Parameter.TIMER_MODE),
      DataEntry.of(Parameter.READ_ALARM),
      DataEntry.of(11), // Active timer countdown
    ]);
    // Send package and wait for response.
    return this.modbusClient.send(packet, device.ip).then(mapModbusResponse);
  }

  async locateDevices() {
    const locatedDevices = await this.modbusClient.findDevices();
    const oldamount = this.deviceList.length;
    this.log(
      `Current we located ${oldamount} devices, lets see if we found more: amount located ${locatedDevices.length}`
    );
    const homeydevices = this.getDevices(); // We want to be able to tell any non initialized devices they are ready for use
    locatedDevices.forEach((locatedDevice) => {
      // Lets see if we already knew about this device
      const knowndevice = this.deviceList.find(
        (device) => device.id === locatedDevice.id
      );
      if (!knowndevice) {
        this.log(
          `Located new device with id ${locatedDevice.id} remember it and initialize it`
        );
        this.deviceList.push(locatedDevice); // So we remember the located device and its IP
        const homeydevice = homeydevices.find(
          (device) => device.getData().id === locatedDevice.id
        );
        if (homeydevice) {
          homeydevice.discovery(locatedDevice.id);
        } else this.log('Located device is not added to Homey yet');
      }
    });
    // Now lets ask all our homey enabled devices to update their state
    homeydevices.forEach((homeydevice) => {
      if (homeydevice.getAvailable()) {
        this.log(
          `We know this device [${
            homeydevice.getData().id
          }] already, lets refresh its state`
        );
        homeydevice.updateDeviceState();
      } else {
        this.log('Not getting the state since device is not available yet');
      }
    });
  }

  locateDeviceById(id) {
    return this.deviceList.find((e) => {
      return e.id === id;
    });
  }

  async onPair(session) {
    session.setHandler('list_devices', async (data) => {
      this.log('Provide user list of discovered Vento fans to choose from.');
      this.log('Start discovery of Vento Expert devices on the local network');
      await this.locateDevices();
      this.log(JSON.stringify(this.deviceList));
      this.log(`Located [${this.deviceList.length}] Vento expert devices`);
      // Lets return the mapped list
      return this.deviceList.map((device) => {
        this.log(JSON.stringify(device));
        const ventodevice = {
          id: device.id,
          name: `Vento Expert ${device.id}`,
          data: {
            id: device.id,
          },
        };
        this.log(`located: ${JSON.stringify(ventodevice)}`);
        return ventodevice;
      });
    });

    session.setHandler('add_devices', async (data) => {
      await session.showView('add_devices');
      if (data.length > 0) {
        this.log(`Vento fan [${data[0].name}] added`);
      } else this.log('no Vento fan added');
    });
  }
}

module.exports = VentoDriver;
