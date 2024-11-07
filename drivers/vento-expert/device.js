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
    await this.updateCapabilities();
    await this.setupCapabilities();
  }

  async updateCapabilities()
  {
    if(!this.hasCapability('fan_speed'))
      this.addCapability('fan_speed');
  }

  async setupCapabilities()
  {
    if (this.hasCapability('onoff'))
      this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    if (this.hasCapability('speedMode')) {
      this.registerCapabilityListener('speedMode', this.onCapabilitySpeedmode.bind(this));
      await this.setupFlowSpeedMode();
    }
    if (this.hasCapability('manualSpeed')) {
      this.registerCapabilityListener('manualSpeed', this.onCapabilityManualSpeed.bind(this));
      await this.setupFlowManualSpeed();
    }
    if (this.hasCapability('fan_speed')) {
      this.registerCapabilityListener('fan_speed', this.onCapabilityFanSpeed.bind(this));
      //await this.setupFlowManualSpeed();
    }
    if (this.hasCapability('operationMode')) {
      this.registerCapabilityListener('operationMode', this.onCapabilityOperationMode.bind(this));
      await this.setupFlowOperationMode();
    }
    if (this.hasCapability('alarm_generic')) {
      this.homey.flow.getConditionCard('alarm_generic').registerRunListener((args, state) => {
        return args.device.getCapabilityValue('alarm_generic');
      });
    }
    if (this.hasCapability('alarm_boost')) {
      this.homey.flow.getConditionCard('alarm_boost').registerRunListener((args, state) => {
        return args.device.getCapabilityValue('alarm_boost');
      });
    }
    if (this.hasCapability('alarm_filter')) {
      this.homey.flow.getConditionCard('alarm_filter').registerRunListener((args, state) => {
        return args.device.getCapabilityValue('alarm_filter');
      });
    }
    if (this.hasCapability('timerMode')) {
      this.registerCapabilityListener('timerMode', this.onCapabilityTimerMode.bind(this));
      await this.setupFlowTimerMode();
    }    
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
    let state = await this.driver.getDeviceState(this.deviceObject,this.devicepwd).catch((error) => {
      this.setUnavailable(error);
    });
    if(state===undefined)
      return;
    else
      this.setAvailable();
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
    this.setCapabilityValue('fan_speed', (state.speed.manualspeed/255))
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
  async onCapabilityFanSpeed( value, opts ) {
    await this.driver.setManualSpeed(this.deviceObject,this.devicepwd, (255*value));
  }
  async onCapabilityOperationMode( value, opts ) {
    await this.driver.setOperationMode(this.deviceObject,this.devicepwd, value);
    //this.setCapabilityValue('operationMode', Number(value));
  }  
  async onCapabilityTimerMode( value, opts ) {
    await this.driver.setTimerMode(this.deviceObject,this.devicepwd, value);
    //this.setCapabilityValue('operationMode', Number(value));
  }

  async setupFlowOperationMode() {
    this.log('Create the flow for the operation mode capability');
    //Now setup the flow cards
    this._flowOperationMode = await this.homey.flow.getActionCard('operation_mode'); 
    this._flowOperationMode
      .registerRunListener(async (args, state) => {
        this.log('attempt to change operation mode: '+args.operationMode);
        this.setCapabilityValue('operationMode', args.operationMode);
        await this.driver.setOperationMode(args.device.deviceObject,args.device.devicepwd, args.operationMode);
      });
  }

  async setupFlowSpeedMode() {
    this.log('Create the flow for the speed mode capability');
    //Now setup the flow cards
    this._flowSpeedMode = await this.homey.flow.getActionCard('speed_mode'); 
    this._flowSpeedMode
      .registerRunListener(async (args, state) => {
        this.log('attempt to change speed mode: '+args.speedMode);
        this.setCapabilityValue('speedMode', args.speedMode);
        await this.driver.setSpeedMode(args.device.deviceObject,args.device.devicepwd, args.speedMode);
      });
  }

  async setupFlowManualSpeed() {
    this.log('Create the flow for the manual speed capability');
    //Now setup the flow cards
    this._flowManualSpeed = await this.homey.flow.getActionCard('manualSpeed_set'); 
    this._flowManualSpeed
      .registerRunListener(async (args, state) => {
        this.log('attempt to change manual speed: '+args.speed);
        this.setCapabilityValue('manualSpeed', args.speed);
        this.setCapabilityValue('fan_speed', ((args.speed/100)-1));
        await this.driver.setManualSpeed(args.device.deviceObject,args.device.devicepwd, (255*(args.speed/100)));

      });
  }

  async setupFlowFanSpeed() {
    this.log('Create the flow for the fan speed capability');
    //Now setup the flow cards
    this._flowFanSpeed
      .registerRunListener(async (args, state) => {
        this.log('attempt to change fan speed: '+args.speed);
        this.setCapabilityValue('fan_speed', (args.fan_speed-1));
        this.setCapabilityValue('manualSpeed', (args.fan_speed*100));
        await this.driver.setManualSpeed(args.device.deviceObject,args.device.devicepwd, (255*(args.speed/100)));

      });
  }

  async setupFlowTimerMode() {
    this.log('Create the flow for the timer mode capability');
    //Now setup the flow cards
    this._flowTimerMode = await this.homey.flow.getActionCard('timer_mode'); 
    this._flowTimerMode
      .registerRunListener(async (args, state) => {
        this.log('attempt to change timer mode: '+args.timerMode);
        this.setCapabilityValue('timerMode', args.timerMode);
        await this.driver.setTimerMode(args.device.deviceObject,args.device.devicepwd, args.timerMode);
      });
  }
}

module.exports = VentoDevice;
