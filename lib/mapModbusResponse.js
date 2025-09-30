'use strict';

const { Parameter } = require('blaubergventojs');
const { getEnumKeyByEnumValue } = require('./mapEnum');

module.exports = (result) => {
  if (result != null) {
    const values = result.packet._dataEntries.reduce((acc, { parameter, value }) => {
      const key = getEnumKeyByEnumValue(Parameter, parameter) || parameter;
      return key ? { ...acc, [key]: value } : acc;
    }, {});

    let unittypelabel = 'Vento Expert';
    switch (values['UNIT_TYPE'][0]) {
      case 1:
        unittypelabel = 'Vento Expert A50-1 W V.2 | Vento Expert A85-1 W V.2 | Vento Expert A100-1 W V.2';
        break;
      case 4:
        unittypelabel = 'Vento Expert Duo A30-1 W V.2';
        break;
      case 5:
        unittypelabel = 'Vento Expert A30 W V.2';
        break;
      default:
        unittypelabel = 'Vento Expert';
        break;
    }

    return {
      onoff: values['ON_OFF'][0],
      speed: {
        mode: values['SPEED'][0],
        manualspeed: values['MANUAL_SPEED'][0],
      },
      boost: {
        mode: values['BOOT_MODE'][0],
        deactivationtimer: values['BOOST_MODE_DEACTIVATION_DELAY'][0],
      },
      operationmode: values['VENTILATION_MODE'][0],
      filter: {
        alarm: values['FILTER_ALARM'][0],
        timer: {
          min: values['FILTER_TIMER'][0],
          hour: values['FILTER_TIMER'][1],
          days: values['FILTER_TIMER'][2],
        },
      },
      humidity: {
        current: values['CURRENT_HUMIDITY'][0],
        sensoractivation: values['HUMIDITY_SENSOR_ACTIVATION'][0],
        threshold: values['HUMIDITY_THRESHOLD'][0],
        activated: 0,
      },
      unittype: unittypelabel,
      fan: {
        rpm: values['FAN1RPM'][0],
      },
      timers: {
        mode: values['TIMER_MODE'][0],
        countdown: {
          sec: values[11][0],
          min: values[11][1],
          hour: values[11][2],
        },
      },
      alarm: values['READ_ALARM'][0],
    };
  }
  throw new Error('device not responding, is your device password correct?');
};
