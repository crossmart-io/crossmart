import { AgentWorkerContextView } from '../enums/agent-worker-context-view.enum.js';
import { conversationTitle } from './conversation-title.js';
import { describePageContext } from './page-context.js';

describe('page context and titles', () => {
  it('describes the page and the ids on it', () => {
    const note = describePageContext({
      view: AgentWorkerContextView.ChannelMap,
      connectionId: 'c1',
    });
    expect(note).toContain('channel_map');
    expect(note).toContain('store they are looking at has id c1');
  });

  it('says nothing without context', () => {
    expect(describePageContext(undefined)).toBeNull();
    expect(describePageContext({})).toBeNull();
  });

  it('titles a conversation with its first message on one line, cut to fit', () => {
    expect(conversationTitle('  Fix my\nfailed listings ')).toBe('Fix my failed listings');
    const title = conversationTitle('word '.repeat(40));
    expect(title.length).toBe(80);
    expect(title.endsWith('…')).toBe(true);
  });
});
