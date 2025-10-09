import { Response, Parameter } from 'blaubergventojs';
import { Capabilities, DeviceSettingFields } from './capabilities';
import { parametersToValues } from './mapModbusResponse';

type MappableCapabilities = Capabilities | DeviceSettingFields;

export type CapabilityType =
  | keyof typeof Capabilities
  | keyof typeof DeviceSettingFields;
type PossibleValues = number | string | boolean | undefined;
type DataEntityValueToValue =
  | ((values: number[] | undefined) => PossibleValues)
  | undefined;
type ResponseToCapabilityFunctions = Record<
  CapabilityType,
  DataEntityValueToValue
>;

const paramsForCapability: Record<CapabilityType, keyof typeof Parameter> = {
  alarm_boost: 'BOOT_MODE',
  alarm_filter: 'FILTER_ALARM',
  filter_timer: 'FILTER_TIMER',
  alarm_generic: 'READ_ALARM',
  measure_humidity: 'CURRENT_HUMIDITY',
  measure_RPM: 'FAN1RPM',
  speedMode: 'SPEED',
  manualSpeed: 'MANUAL_SPEED',
  fan_speed: 'MANUAL_SPEED',
  operationMode: 'VENTILATION_MODE',
  timerMode: 'TIMER_MODE',
  timerMode_timer: '11' as keyof typeof Parameter, // Active timer countdown
  alarm_connectivity: 'CURRENT_IP_ADDRESS',
  onoff: 'ON_OFF',
  boost_delay: 'BOOST_MODE_DEACTIVATION_DELAY',
  humidity_sensor: 'HUMIDITY_SENSOR_ACTIVATION',
  humidity_threshold: 'HUMIDITY_THRESHOLD',
  unit_type: 'UNIT_TYPE',
};

const capabilityToParameterMap: ResponseToCapabilityFunctions = {
  alarm_boost: (values) => values?.[0] !== 0,
  alarm_filter: (values) => values?.[0] === 1,
  filter_timer: (values) =>
    [values?.[2], values?.[1], values?.[0]]
      .map((n) => n?.toString().padStart(2, '0'))
      .join(':'),
  alarm_generic: (values) => values?.[0] !== 0,
  measure_humidity: (values) => values?.[0],
  measure_RPM: (values) => values?.[0],
  speedMode: (values) => values?.[0].toString(),
  manualSpeed: (values) => ((values?.[0] ?? -1) / 255) * 100,
  fan_speed: (values) => (values?.[0] ?? -1) / 255,
  operationMode: (values) => values?.[0].toString(),
  timerMode: (values) => values?.[0].toString(),
  timerMode_timer: (values) =>
    [values?.[2], values?.[1], values?.[0]]
      .map((n) => n?.toString().padStart(2, '0'))
      .join(':'),
  alarm_connectivity: (values) => !values,
  onoff: (values) => values?.[0] === 1,
  boost_delay: (values) => values?.[0],
  humidity_sensor: (values) => values?.[0] === 1,
  humidity_threshold: (values) => values?.[0],
  unit_type: (values) => {
    switch (values?.[0]) {
      case 1:
        return 'Vento Expert A50-1 W V.2 | Vento Expert A85-1 W V.2 | Vento Expert A100-1 W V.2';
      case 4:
        return 'Vento Expert Duo A30-1 W V.2';
      case 5:
        return 'Vento Expert A30 W V.2';
      default:
        return 'Vento Expert';
    }
  },
};

export type CapabilityResponse = Record<MappableCapabilities, PossibleValues>;

const capabilitiesMapper = (result: Response): CapabilityResponse => {
  const values = parametersToValues(result);
  // @ts-expect-error: not typed yet
  return (
    [...Object.keys(Capabilities), ...Object.keys(DeviceSettingFields)]
      // @ts-expect-error: TS doesn't understand the type here
      .map((capability: CapabilityType) => {
        const mapFunction = capabilityToParameterMap[capability];
        if (mapFunction) {
          const hasValue = values[paramsForCapability[capability]];
          if (hasValue !== undefined && hasValue.length > 0) {
            return { [capability]: mapFunction(hasValue) };
          }
        }
        return {};
      })
      .reduce((a, b) => ({ ...a, ...b }), {})
  );
};

export default capabilitiesMapper;
