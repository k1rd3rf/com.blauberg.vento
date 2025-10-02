import capabilityMapper from './capabilityMapper';
import { statusResponse } from './__mockdata__/statusResponse';

describe('capabilityMapper', () => {
  it('maps packet to capability response', () => {
    expect(capabilityMapper(statusResponse)).toMatchSnapshot();
  });
});
