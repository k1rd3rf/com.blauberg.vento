'use strict';

const { Device } = require('homey');

class VentoDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    let id = this.getData().id;
    this.log('Locating device with id '+id);
    await this.discovery(id);
  }

  async discovery(id)
  {
    this.deviceObject=this.driver.locateDeviceById(id);
    if(this.deviceObject==null){
      this.setUnavailable("Device not discovered yet");
      this.log('Vento device could not be located');
    } else {
      this.setAvailable();
      this.log('Vento device has been initialized: ['+this.deviceObject.ip+']');
      this.devicepwd=await this.getSetting('devicepwd');
    }
  }

  async updateDeviceState()
  {
    this.log('Requesting the current device state');
    let state = await this.driver.getDeviceState(this.deviceObject,this.devicepwd);
    this.log(JSON.stringify(state));
    this.setCapabilityValue('onoff',(state.onoff==1));
    this.setCapabilityValue('alarm_boost',(state.boot.mode==1));
    this.setCapabilityValue('alarm_filter',(state.filter.alarm==1));
    this.setCapabilityValue('alarm_generic',(state.alarm!=0));
    this.setCapabilityValue('measure_humidity',state.humidity.current);
    this.setCapabilityValue('measure_RPM',state.fan.rpm);
    //Now handle the different modes
    this.setCapabilityValue('speedMode', state.speed.mode.toString());
    this.setCapabilityValue('manualSpeed', (state.speed.manualspeed/255)*100);
    this.setCapabilityValue('operationMode',state.operationmode.toString());
    this.setCapabilityValue('timerMode',state.timers.mode.toString());
    
    this.setCapabilityValue('filter_timer',state.filter.timer.days+':'+state.filter.timer.hour+':'+state.filter.timer.min);
    this.setCapabilityValue('boot_timer',state.boot.deactivationtimer.toString());
    
    //Update our settings based on current values in the device
    await this.setSettings({
      // only provide keys for the settings you want to change
      devicemodel:state.unittype,
      humidity_sensor: (state.humidity.sensoractivation==1),
      humidity_threshold: state.humidity.threshold
    });
    this.setSettings
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Vento device has been added');
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if(changedKeys.includes('devicepwd'))
    {
      this.devicepwd=newSettings.devicepwd;
      this.updateDeviceState();
    }
  }

}

module.exports = VentoDevice;
