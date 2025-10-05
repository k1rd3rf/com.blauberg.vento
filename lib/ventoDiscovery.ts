import { BlaubergVentoClient } from 'blaubergventojs';

export default class VentoDiscovery {
  modbusClient!: BlaubergVentoClient;

  constructor() {
    this.modbusClient = new BlaubergVentoClient();
    this.modbusClient.timeout = 1500;
  }

  public findDevices = async () => this.modbusClient.findDevices();

  public findById = async (id: string) =>
    this.findDevices().then((devices) =>
      devices.find((device) => device.id === id)
    );
}
