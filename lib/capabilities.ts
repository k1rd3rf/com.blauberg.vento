/* eslint-disable camelcase */

export enum Capabilities {
  alarm_connectivity = 'alarm_connectivity',
  onoff = 'onoff',
  fan_speed = 'fan_speed',
  measure_humidity = 'measure_humidity',

  alarm_boost = 'alarm_boost',
  alarm_filter = 'alarm_filter',
  alarm_generic = 'alarm_generic',
  filter_timer = 'filter_timer',
  manualSpeed = 'manualSpeed',
  measure_RPM = 'measure_RPM',
  operationMode = 'operationMode',
  speedMode = 'speedMode',
  timerMode = 'timerMode',
  timerMode_timer = 'timerMode_timer',
}

export enum ActionCards {
  manualSpeed_set = 'manualSpeed_set',
  operation_mode = 'operation_mode',
  speed_mode = 'speed_mode',
  timer_mode = 'timer_mode',
}
