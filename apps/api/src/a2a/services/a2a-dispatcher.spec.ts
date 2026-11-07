import type { AskCaller } from '@crossmart/core';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import type { AskCallerResolver } from '../../ask/services/ask-caller.resolver.js';
import { A2aErrorCode } from '../enums/a2a-error-code.enum.js';
import { A2aDispatcher } from './a2a-dispatcher.js';
import type { A2aMessageHandler } from './a2a-message.handler.js';
import type { A2aTaskReader } from './a2a-task.reader.js';

const REQUEST = {} as AuthenticatedRequest;
const TASK = { id: 't1', status: { state: 'TASK_STATE_COMPLETED' } };

function setup() {
  const callers = { resolve: vi.fn().mockResolvedValue({ ownerKey: 'owner' } as AskCaller) };
  const messages = { send: vi.fn().mockResolvedValue({ task: TASK }) };
  const tasks = { get: vi.fn().mockResolvedValue(TASK), list: vi.fn(), cancel: vi.fn() };
  const dispatcher = new A2aDispatcher(
    callers as unknown as AskCallerResolver,
    messages as unknown as A2aMessageHandler,
    tasks as unknown as A2aTaskReader,
  );
  return { dispatcher, messages, tasks };
}

const call = (method: string, params: unknown = { id: 't1' }) => ({
  jsonrpc: '2.0',
  id: 7,
  method,
  params,
});

describe('A2aDispatcher', () => {
  it('runs a method and answers with its result under the request id', async () => {
    const { dispatcher, tasks } = setup();

    const response = await dispatcher.handle(call('GetTask'), REQUEST, '1.0');

    expect(response).toEqual({ jsonrpc: '2.0', id: 7, result: TASK });
    expect(tasks.get).toHaveBeenCalledWith({ id: 't1' }, { ownerKey: 'owner' });
  });

  it('accepts any 1.0 patch version and refuses other versions, an empty one meaning 0.3', async () => {
    const { dispatcher } = setup();

    expect(await dispatcher.handle(call('GetTask'), REQUEST, '1.0.3')).toHaveProperty('result');
    for (const version of ['', '0.3', '2.0']) {
      const response = await dispatcher.handle(call('GetTask'), REQUEST, version);
      expect(response).toMatchObject({ error: { code: A2aErrorCode.VersionNotSupported } });
    }
  });

  it('checks parameters before running a method', async () => {
    const { dispatcher, messages } = setup();

    const response = await dispatcher.handle(
      call('SendMessage', { message: { role: 'ROLE_AGENT', parts: [], messageId: 'm' } }),
      REQUEST,
      '1.0',
    );

    expect(response).toMatchObject({ id: 7, error: { code: A2aErrorCode.InvalidParams } });
    expect(messages.send).not.toHaveBeenCalled();
  });

  it('answers an invalid envelope by its id when it has one', async () => {
    const { dispatcher } = setup();

    expect(await dispatcher.handle({ id: 'x', method: 'GetTask' }, REQUEST, '1.0')).toMatchObject({
      id: 'x',
      error: { code: A2aErrorCode.InvalidRequest },
    });
    expect(await dispatcher.handle('not json-rpc', REQUEST, '1.0')).toMatchObject({ id: null });
  });

  it('hides unexpected failures behind a bare internal error', async () => {
    const { dispatcher, tasks } = setup();
    tasks.get.mockRejectedValue(new Error('database password is hunter2'));

    const response = await dispatcher.handle(call('GetTask'), REQUEST, '1.0');

    expect(response).toMatchObject({
      error: { code: A2aErrorCode.InternalError, message: 'Internal error' },
    });
    expect(JSON.stringify(response)).not.toContain('hunter2');
  });
});
