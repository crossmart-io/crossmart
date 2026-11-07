import { Module } from '@nestjs/common';
import { AskApiModule } from '../ask/ask.module.js';
import { AskPollThrottlerGuard } from '../ask/guards/ask-poll-throttler.guard.js';
import { ThrottlingModule } from '../common/throttling/throttling.module.js';
import { A2aController } from './controllers/a2a.controller.js';
import { AgentCardController } from './controllers/agent-card.controller.js';
import { A2aQuestionThrottlerGuard } from './guards/a2a-throttler.guard.js';
import { A2aDispatcher } from './services/a2a-dispatcher.js';
import { A2aMessageHandler } from './services/a2a-message.handler.js';
import { A2aTaskReader } from './services/a2a-task.reader.js';
import { AgentCardFactory } from './services/agent-card.factory.js';

/**
 * Agent2Agent (A2A 1.0) for Ask Crossmart (ADR 0025): the Agent Card at
 * `/.well-known/agent-card.json` and the JSON-RPC endpoint at `/a2a`.
 */
@Module({
  imports: [AskApiModule, ThrottlingModule],
  controllers: [AgentCardController, A2aController],
  providers: [
    AgentCardFactory,
    A2aDispatcher,
    A2aMessageHandler,
    A2aTaskReader,
    AskPollThrottlerGuard,
    A2aQuestionThrottlerGuard,
  ],
})
export class A2aApiModule {}
