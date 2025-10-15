export * from 'blaubergventojs';

export class BlaubergVentoClient {
  static readonly _sendMock = jest.fn((packet, ip) =>
    Promise.resolve({ packet, ip })
  );

  send = BlaubergVentoClient._sendMock;

  findDevices = jest
    .fn()
    .mockResolvedValue([{ id: 'TEST1234', ip: '127.0.0.3' }]);

  findById = async (id: string) => ({ id, ip: '127.0.0.2' });
}
