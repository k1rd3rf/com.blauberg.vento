import {
  BlaubergVentoClient, Packet, FunctionType, DataEntry, Parameter,
} from 'blaubergventojs';
import mapModbusResponse from './mapModbusResponse';

export default class Api {
    modbusClient!: BlaubergVentoClient

    deviceId: string;
    devicePass: string;
    deviceIp: string;

    constructor(deviceId: string, devicePass: string, deviceIp: string) {
      this.modbusClient = new BlaubergVentoClient();
      this.modbusClient.timeout = 1500;

      this.deviceId = deviceId;
      this.devicePass = devicePass;
      this.deviceIp = deviceIp;
    }

    log: typeof console.log = (...args) => {
      // eslint-disable-next-line no-console
      console.log(`[API - ${this.deviceId}]`, ...args);
    };

    error: typeof console.error = (...args) => {
      // eslint-disable-next-line no-console
      console.error(`[API - ${this.deviceId}]`, ...args);
    };

    send = async (packet: Packet, ip: string) => this.modbusClient.send(packet, ip).then((r) => {
      if (r != null) {
        return mapModbusResponse(r);
      }
      return {};
    });

    public getDeviceState = async () => this.send(new Packet(this.deviceId, this.devicePass, FunctionType.READ, [
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
      DataEntry.of(11 as Parameter), // Active timer countdown
    ]), this.deviceIp);

    private readonly setDeviceValue = async (param: Parameter, value: number) => this.send(new Packet(this.deviceId, this.devicePass, FunctionType.WRITE, [
      DataEntry.of(param, value),
    ]), this.deviceIp);

    setOnOffStatus = async (value: number) => this.setDeviceValue(Parameter.ON_OFF, value);

    setSpeedMode = async (value: number) => this.setDeviceValue(Parameter.SPEED, value);

    setOperationMode = async (value: number) => this.setDeviceValue(Parameter.VENTILATION_MODE, value);

    setTimerMode = async (value: number) => this.setDeviceValue(Parameter.TIMER_MODE, value);

    setManualSpeed = async (value: number) => this.setDeviceValue(Parameter.MANUAL_SPEED, value);

    setHumiditySensor = async (value: number) => this.setDeviceValue(Parameter.HUMIDITY_SENSOR_ACTIVATION, value);

    setHumiditySensorThreshold = async (value: number) => this.setDeviceValue(Parameter.HUMIDITY_THRESHOLD, value);

    setBoostDelay = async (value: number) => this.setDeviceValue(Parameter.BOOST_MODE_DEACTIVATION_DELAY, value);
}
