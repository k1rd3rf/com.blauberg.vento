export * from 'blaubergventojs';

export const sendMock = jest.fn((packet, ip) =>
  Promise.resolve({ packet, ip })
);

export class BlaubergVentoClient {
  send = sendMock;

  findDevices = jest
    .fn()
    .mockResolvedValue([{ id: 'TEST1234', ip: '127.0.0.3' }]);

  findById = (id: string) => Promise.resolve({ id, ip: '127.0.0.2' });
}
