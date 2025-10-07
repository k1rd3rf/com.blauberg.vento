'use strict';

const { Driver } = require('homey');
const {
  BlaubergVentoClient,
  Packet,
  FunctionType,
  Parameter,
  DataEntry,
} = require('blaubergventojs');
const {
  parametersToValues,
  default: mapModbusResponse,
  // eslint-disable-next-line node/no-missing-require
} = require('../../lib/mapModbusResponse');
// eslint-disable-next-line node/no-missing-require
const { getEnumKeyByEnumValue } = require('../../lib/mapEnum');

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
  start_discover_loop = () => {
    this._timer = this.homey.setInterval(async () => {
      await this.locateDevices();
    }, 10000);
  };

  send = (packet, ip) => {
    const funcType = getEnumKeyByEnumValue(FunctionType, packet.functionType);
    const params = parametersToValues({ packet });
    const payload =
      packet.functionType === FunctionType.READ
        ? Object.keys(params)
        : JSON.stringify(params, null, 2);
    this.log(
      `Sending ${funcType} to device ${packet.deviceId} at ${ip}:`,
      payload
    );

    return this.modbusClient
      .send(packet, ip)
      .then((r) => {
        if (r != null) {
          return mapModbusResponse(r);
        }
        return {};
      })
      .then((response) => {
        this.log(`Response from device ${packet.deviceId} at ${ip}:`, response);
        return response;
      })
      .catch((e) => {
        this.error(
          `Error communicating with device ${packet.deviceId} at ${ip}: ${e.message}`
        );
        throw e;
      });
  };

  getDeviceState = async (device, devicepass) =>
    this.send(
      new Packet(device.id, devicepass, FunctionType.READ, [
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
      ]),
      device.ip
    );

  /**
   * Use FunctionType.WRITEREAD instead of FunctionType.WRITE to ensure the device
   * returns the updated value after writing. This is required by the protocol/device
   * to confirm the value was set correctly.
   */
  setDeviceValue = async (device, devicepass, param, value) =>
    this.send(
      new Packet(device.id, devicepass, FunctionType.WRITEREAD, [
        DataEntry.of(param, value),
      ]),
      device.ip
    );

  setOnOffStatus = async (device, devicepass, value) =>
    this.setDeviceValue(device, devicepass, Parameter.ON_OFF, value);

  setSpeedMode = async (device, devicepass, value) => {
    if (value.toString() === '0') {
      return this.setOnOffStatus(device, devicepass, value);
    }
    return this.setDeviceValue(device, devicepass, Parameter.SPEED, value);
  };

  setOperationMode = async (device, devicepass, value) =>
    this.setDeviceValue(device, devicepass, Parameter.VENTILATION_MODE, value);

  setTimerMode = async (device, devicepass, value) =>
    this.setDeviceValue(device, devicepass, Parameter.TIMER_MODE, value);

  setManualSpeed = async (device, devicepass, value) =>
    this.setDeviceValue(device, devicepass, Parameter.MANUAL_SPEED, value);

  setHumiditySensor = async (device, devicepass, value) =>
    this.setDeviceValue(
      device,
      devicepass,
      Parameter.HUMIDITY_SENSOR_ACTIVATION,
      value
    );

  setHumiditySensorThreshold = async (device, devicepass, value) =>
    this.setDeviceValue(
      device,
      devicepass,
      Parameter.HUMIDITY_THRESHOLD,
      value
    );

  setBoostDelay = async (device, devicepass, value) =>
    this.setDeviceValue(
      device,
      devicepass,
      Parameter.BOOST_MODE_DEACTIVATION_DELAY,
      value
    );

  locateDevices = async () => {
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
  };

  locateDeviceById = (id) =>
    this.deviceList.find((e) => {
      return e.id === id;
    });

  onPair = async (session) => {
    session.setHandler('list_devices', async (data) => {
      this.log('Provide user list of discovered Vento fans to choose from.');
      this.log('Start discovery of Vento Expert devices on the local network');
      await this.locateDevices();
      this.log(`Located [${this.deviceList.length}] Vento expert devices`);
      return this.deviceList.map((device) => {
        const ventoDevice = {
          id: device.id,
          name: `Vento Expert ${device.id}`,
          data: {
            id: device.id,
          },
        };
        this.log(`located: ${JSON.stringify(ventoDevice)}`);
        return ventoDevice;
      });
    });

    session.setHandler('add_devices', async (data) => {
      await session.showView('add_devices');
      if (data.length > 0) {
        this.log(`Vento fan [${data[0].name}] added`);
      } else this.log('no Vento fan added');
    });
  };
}

module.exports = VentoDriver;
