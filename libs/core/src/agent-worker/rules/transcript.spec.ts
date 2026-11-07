import type { AgentWorkerAction } from '@crossmart/database';
import { AiContentBlockType } from '../../ai/enums/ai-content-block-type.enum.js';
import { AiConversationRole } from '../../ai/enums/ai-conversation-role.enum.js';
import { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import { AgentWorkerRole } from '../enums/agent-worker-role.enum.js';
import type { AgentWorkerMessageRecord } from '../repositories/agent-worker-message.repository.js';
import { buildTranscript } from './transcript.js';

function message(
  role: AgentWorkerRole,
  content: unknown[],
  actions: Partial<AgentWorkerAction>[] = [],
): AgentWorkerMessageRecord {
  return { role, content, actions } as unknown as AgentWorkerMessageRecord;
}

const USE = { type: AiContentBlockType.ToolUse, id: 'tu_1', name: 'list_products', input: {} };

describe('buildTranscript', () => {
  it('answers each tool call with its fenced result, merged with the next message', () => {
    const transcript = buildTranscript([
      message(AgentWorkerRole.User, [{ type: AiContentBlockType.Text, text: 'Hi' }]),
      message(
        AgentWorkerRole.Assistant,
        [USE],
        [{ toolUseId: 'tu_1', status: AgentWorkerActionStatus.Succeeded, result: '[]' }],
      ),
      message(AgentWorkerRole.User, [{ type: AiContentBlockType.Text, text: 'Thanks' }]),
    ]);

    expect(transcript.map((entry) => entry.role)).toEqual([
      AiConversationRole.User,
      AiConversationRole.Assistant,
      AiConversationRole.User,
    ]);
    const [result, followUp] = transcript[2]?.content ?? [];
    expect(result).toMatchObject({ toolUseId: 'tu_1', isError: false });
    expect(result).toHaveProperty(
      'content',
      '<tool_output tool="list_products">\n[]\n</tool_output>',
    );
    expect(followUp).toEqual({ type: AiContentBlockType.Text, text: 'Thanks' });
  });

  it('answers a call with no stored action as not finished, so the history stays valid', () => {
    const transcript = buildTranscript([
      message(AgentWorkerRole.User, [{ type: AiContentBlockType.Text, text: 'Go' }]),
      message(AgentWorkerRole.Assistant, [USE]),
    ]);
    expect(transcript.at(-1)?.content[0]).toMatchObject({ isError: true, toolUseId: 'tu_1' });
  });

  it('drops stored content it cannot read rather than failing', () => {
    expect(buildTranscript([message(AgentWorkerRole.Assistant, [{ type: 'mystery' }])])).toEqual(
      [],
    );
  });
});
