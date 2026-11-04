import { DEFAULT_WORKSPACE_NAME } from '../tenancy.constants.js';
import { workspaceDisplayName } from './workspace-display-name.js';

describe('workspaceDisplayName', () => {
  it('uses the organization name for a default workspace and the own name otherwise', () => {
    expect(workspaceDisplayName(DEFAULT_WORKSPACE_NAME, 'Ana Cohen')).toBe('Ana Cohen');
    expect(workspaceDisplayName('EU store', 'Ana Cohen')).toBe('EU store');
  });
});
