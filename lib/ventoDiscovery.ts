import { BlaubergVentoClient } from 'blaubergventojs';

export default class VentoDiscovery {
  modbusClient!: BlaubergVentoClient;

  constructor() {
    this.modbusClient = new BlaubergVentoClient();
    this.modbusClient.timeout = 1500;
  }

  public findDevices = async () => {
    const devices = await this.modbusClient.findDevices();
    if (!devices.length) {
      // devices.push({ id: '003800415646570D', ip: '192.168.86.32' });
    }
    // console.log(`Discovered ${devices.length} Vento devices`, devices);
    return devices;
  };

  public findById = async (id: string) =>
    this.findDevices().then((devices) =>
      devices.find((device) => device.id === id)
    );
}
