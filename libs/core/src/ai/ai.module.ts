import { Module } from '@nestjs/common';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { AnthropicAiProvider } from './providers/anthropic/anthropic-ai.provider.js';
import { AnthropicClientFactory } from './providers/anthropic/anthropic-client.factory.js';
import { AiProvider } from './providers/ai-provider.js';
import { AiUsageRepository } from './repositories/ai-usage.repository.js';
import { AiGateway } from './services/ai-gateway.service.js';
import { AiUsageService } from './services/ai-usage.service.js';

/**
 * The AI layer: the `AiProvider` abstraction (Anthropic today), metering of every call, and
 * `AiGateway`, through which agents call the model. Without `ANTHROPIC_API_KEY` the module
 * still loads and AI features report that AI is not configured.
 */
@Module({
  imports: [EntitlementsModule],
  providers: [
    AnthropicClientFactory,
    { provide: AiProvider, useClass: AnthropicAiProvider },
    AiUsageRepository,
    AiUsageService,
    AiGateway,
  ],
  exports: [AiGateway, AiUsageService],
})
export class AiModule {}
