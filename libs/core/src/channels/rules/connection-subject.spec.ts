import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { connectionSubject } from './connection-subject.js';

describe('connectionSubject', () => {
  it('names the connection by its id and display name', () => {
    expect(connectionSubject({ id: 'connection-1', displayName: 'eBay US' })).toEqual({
      type: ActivitySubjectType.ChannelConnection,
      id: 'connection-1',
      label: 'eBay US',
    });
  });
});
