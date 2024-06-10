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
    await this.setupCapabilities();
  }

  async setupCapabilities()
  {
    if (this.hasCapability('onoff'))
      this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    if (this.hasCapability('speedMode'))
      this.registerCapabilityListener('speedMode', this.onCapabilitySpeedmode.bind(this));
    if (this.hasCapability('manualSpeed'))
      this.registerCapabilityListener('manualSpeed', this.onCapabilityManualSpeed.bind(this));
    if (this.hasCapability('operationMode'))
      this.registerCapabilityListener('operationMode', this.onCapabilityOperationMode.bind(this));
    if (this.hasCapability('timerMode'))
      this.registerCapabilityListener('timerMode', this.onCapabilityTimerMode.bind(this));
    
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
    this.setCapabilityValue('alarm_boost',(state.boost.mode!=0));
    this.setCapabilityValue('alarm_filter',(state.filter.alarm==1));
    this.setCapabilityValue('filter_timer',state.filter.timer.days+':'+state.filter.timer.hour+':'+state.filter.timer.min);
    this.setCapabilityValue('alarm_generic',(state.alarm!=0));
    this.setCapabilityValue('measure_humidity',state.humidity.current);
    this.setCapabilityValue('measure_RPM',state.fan.rpm);
    //Now handle the different modes
    this.setCapabilityValue('speedMode', state.speed.mode.toString());
    this.setCapabilityValue('manualSpeed', (state.speed.manualspeed/255)*100);
    this.setCapabilityValue('operationMode',state.operationmode.toString());
    this.setCapabilityValue('timerMode',state.timers.mode.toString());
    this.setCapabilityValue('timerMode_timer',state.timers.countdown.hour+':'+state.timers.countdown.min+':'+state.timers.countdown.sec);
    
    //Update our settings based on current values in the device
    await this.setSettings({
      // only provide keys for the settings you want to change
      devicemodel:state.unittype,
      humidity_sensor: (state.humidity.sensoractivation==1),
      humidity_threshold: state.humidity.threshold,
      boost_delay: state.boost.deactivationtimer
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
    //For the other settings we probably need to push the new value to the device
    if(changedKeys.includes('humidity_sensor'))
      await this.driver.setHumiditySensor(this.deviceObject,this.devicepwd, newSettings.humidity_sensor);
    if(changedKeys.includes('humidity_threshold'))
      await this.driver.setHumiditySensorThreshold(this.deviceObject,this.devicepwd, newSettings.humidity_threshold);
    if(changedKeys.includes('boost_delay'))
      await this.driver.setBoostDelay(this.deviceObject,this.devicepwd, newSettings.boost_delay);
  }

  async onCapabilityOnoff( value, opts ) {
    if(value){
      await this.driver.setOnoffStatus(this.deviceObject,this.devicepwd, 1);
    } else {
      await this.driver.setOnoffStatus(this.deviceObject,this.devicepwd, 0);
    }
    //this.setCapabilityValue('onoff', value);
  }
  async onCapabilitySpeedmode( value, opts ) {
    await this.driver.setSpeedMode(this.deviceObject,this.devicepwd, value);
    //this.setCapabilityValue('speedMode', Number(value));
  }
  async onCapabilityManualSpeed( value, opts ) {
    await this.driver.setManualSpeed(this.deviceObject,this.devicepwd, (255*(value/100)));
    //this.setCapabilityValue('operationMode', Number(value));
  }
  async onCapabilityOperationMode( value, opts ) {
    await this.driver.setOperationMode(this.deviceObject,this.devicepwd, value);
    //this.setCapabilityValue('operationMode', Number(value));
  }  
  async onCapabilityTimerMode( value, opts ) {
    await this.driver.setTimerMode(this.deviceObject,this.devicepwd, value);
    //this.setCapabilityValue('operationMode', Number(value));
  }
}

module.exports = VentoDevice;
