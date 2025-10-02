import { Response, Parameter } from 'blaubergventojs';
import { Capabilities } from './capabilities';
import { parametersToValues } from './mapModbusResponse';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const capabilityToParameterMap: Record<keyof typeof Capabilities, (values: Record<keyof typeof Parameter | string, number[] | undefined>) => any> = {
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
};

export default (result: Response) => {
  const values = parametersToValues(result);
  return Object.keys(Capabilities).map((capability) => {
    // @ts-expect-error: ok now
    const mapFunction = capabilityToParameterMap[capability];
    if (mapFunction) {
      return { [capability]: mapFunction(values) };
    }
  }).reduce((a, b) => ({ ...a, ...b }), {});
};
