import { Driver } from 'homey';
import VentoDiscovery from './ventoDiscovery';

export default class VentoDriver extends Driver {
    _timer!: NodeJS.Timeout
    discoveryClient!: VentoDiscovery
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
      this.log('Vento driver has been initialized');
      this.startPolling();
      this.discoveryClient = new VentoDiscovery();
    }

    startPolling() {
      this._timer = this.homey.setInterval(() => this.locateDevices(), 10000);
    }

    onDeleted = () => {
      if (this._timer) this.homey.clearInterval(this._timer);
    };

    async onPair(session) {
      session.setHandler('list_devices', async (data) => {
        console.log('Provide user list of discovered Vento fans to choose from.');
        this.log('Start discovery of Vento Expert devices on the local network');
        const deviceList = await this.locateDevices();
        this.log(`Located [${deviceList.length}] Vento expert devices`);

        return deviceList.map((device) => {
          const ventodevice = {
            id: device.id,
            name: `Vento Expert ${device.id}`,
            data: {
              id: device.id,
            },
          };
          this.log(`located: ${JSON.stringify(ventodevice)}`);
          return ventodevice;
        });
      });

      session.setHandler('add_devices', async (data) => {
        session.showView('add_devices');
        if (data.length > 0) {
          console.log(`Vento fan [${data[0].name}] added`);
        } else console.log('no Vento fan added');
      });
    }

    async locateDevices(): Promise<{ id: string }[]> {
      const locatedDevices = await this.discoveryClient.findDevices();

      const existingDevices: {id: string}[] = this.getDevices().map((d) => ({ id: d.getData().id })); // We want to be able to tell any non initialized devices they are ready for use
      this.log(`Current we located ${(existingDevices.length)} devices, lets see if we found more: amount located ${locatedDevices.length}`);

      locatedDevices.forEach((locatedDevice) => {
        // Lets see if we already knew about this device
        const knowndevice = existingDevices.find((device) => device.id === locatedDevice.id);
        if (!knowndevice) {
          this.log(`Located new device with id ${locatedDevice.id} remember it and initialize it`);
          existingDevices.push(locatedDevice); // So we remember the located device and its IP
        }
      });
      return existingDevices;
    }
}
