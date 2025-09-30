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
      this.discoveryClient = new VentoDiscovery();
      await this.locateDevices();
    }

    async onPair(session: Driver.PairSession) {
      session.setHandler('list_devices', async () => {
        this.log('Provide user list of discovered Vento fans to choose from.');
        this.log('Start discovery of Vento Expert devices on the local network');
        const deviceList = await this.locateDevices();
        this.log(`Located [${deviceList.length}] Vento expert devices`);

        return deviceList.map((device) => {
          const ventoDevice = {
            id: device.id,
            name: `Vento Expert ${device.id}`,
            data: {
              id: device.id,
            },
          };
          this.log(`located: ${JSON.stringify(ventoDevice)}`);
          return ventoDevice;
        });
      });

      session.setHandler('add_devices', async (data) => {
        await session.showView('add_devices');
        if (data.length > 0) {
          this.log(`Vento fan [${data[0].name}] added`);
        } else this.log('no Vento fan added');
      });
    }

    async locateDevices(): Promise<{ id: string }[]> {
      const locatedDevices = await this.discoveryClient.findDevices();

      const existingDevices: {id: string}[] = this.getDevices().map((d) => ({ id: d.getData().id })); // We want to be able to tell any non initialized devices they are ready for use
      this.log(`Current we located ${(existingDevices.length)} devices, lets see if we found more: amount located ${locatedDevices.length}`);

      locatedDevices.forEach((locatedDevice) => {
        const hasDevice = existingDevices.find((device) => device.id === locatedDevice.id);
        if (!hasDevice) {
          this.log(`Located new device with id ${locatedDevice.id} remember it and initialize it`);
          existingDevices.push(locatedDevice);
        }
      });
      return existingDevices;
    }
}
