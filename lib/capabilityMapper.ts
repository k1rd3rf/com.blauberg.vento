import { Response, Parameter } from 'blaubergventojs';
import { Capabilities, DeviceSettings } from './capabilities';
import { parametersToValues } from './mapModbusResponse';

type MappableCapabilities = Capabilities | DeviceSettings;

type CapabilityTypes = keyof typeof Capabilities | keyof typeof DeviceSettings;

type ResponseToCapabilityFunctions = Record<CapabilityTypes, (values: Record<keyof typeof Parameter | string, number[] | undefined>) => any>;

const capabilityToParameterMap: ResponseToCapabilityFunctions = {
  alarm_boost: (values) => (values.BOOT_MODE?.[0] !== 0),
  alarm_filter: (values) => (values.FILTER_ALARM?.[0] === 1),
  filter_timer: (values) => [values.FILTER_TIMER?.[2], values.FILTER_TIMER?.[1], values.FILTER_TIMER?.[0]].map((n) => n?.toString().padStart(2, '0')).join(':'),
  alarm_generic: (values) => (values.READ_ALARM?.[0] !== 0),
  measure_humidity: (values) => values.CURRENT_HUMIDITY?.[0],
  measure_RPM: (values) => values.FAN1RPM?.[0],
  speedMode: (values) => values.SPEED?.[0].toString(),
  manualSpeed: (values) => ((values.MANUAL_SPEED?.[0] ?? -1) / 255) * 100,
  fan_speed: (values) => ((values.MANUAL_SPEED?.[0] ?? -1) / 255),
  operationMode: (values) => values.VENTILATION_MODE?.[0].toString(),
  timerMode: (values) => values.TIMER_MODE?.[0].toString(),
  timerMode_timer: (values) => [values['11']?.[2], values['11']?.[1], values['11']?.[0]].map((n) => n?.toString().padStart(2, '0')).join(':'),
  alarm_connectivity: (values) => !values,
  onoff: (values) => values.ON_OFF?.[0] === 1,
  boost_delay: (values) => values.BOOST_MODE_DEACTIVATION_DELAY?.[0],
  humidity_sensor: (values) => values.HUMIDITY_SENSOR_ACTIVATION?.[0] === 1,
  humidity_threshold: (values) => values.HUMIDITY_THRESHOLD?.[0],
  unit_type: (values) => {
    switch (values.UNIT_TYPE?.[0]) {
      case 1:
        return 'Vento Expert A50-1 W V.2 | Vento Expert A85-1 W V.2 | Vento Expert A100-1 W V.2';
        break;
      case 4:
        return 'Vento Expert Duo A30-1 W V.2';
        break;
      case 5:
        return 'Vento Expert A30 W V.2';
        break;
      default:
        return 'Vento Expert';
        break;
    }
  },
};
export type CapabilityResponse = Record<MappableCapabilities, number | string | boolean | undefined>;

export default (result: Response): CapabilityResponse => {
  const values = parametersToValues(result);
  // @ts-expect-error: not typed yet
  return [...Object.keys(Capabilities), ...Object.keys(DeviceSettings)].map((capability) => {
    // @ts-expect-error: ok now
    const mapFunction = capabilityToParameterMap[capability];
    if (mapFunction) {
      return { [capability]: mapFunction(values) };
    }
  }).reduce((a, b) => ({ ...a, ...b }), {});
};
