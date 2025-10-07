export * from 'blaubergventojs';

export class BlaubergVentoClient {
  send = jest.fn((packet, ip) => Promise.resolve({ packet, ip }));

  findDevices = jest
    .fn()
    .mockResolvedValue([{ id: 'TEST1234', ip: '127.0.0.3' }]);
}
