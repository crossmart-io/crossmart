import { Injectable } from '@nestjs/common';
import { AskAccountMode } from '../../ai/prompts/ask.v3.prompt.js';
import { ASK_RETRIEVED_CHUNKS } from '../ask.constants.js';
import type { AccountLookupRequest } from '../entities/account-lookup.js';
import type { AskAnswer } from '../entities/ask-answer.js';
import type { AskWorkspaceAccess } from '../entities/ask-caller.js';
import type { AskContextTurn } from '../entities/ask-context.js';
import type { ComposedAnswer } from '../entities/composed-answer.js';
import type { PromptSource } from '../entities/prompt-source.js';
import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import {
  type AskLookupModelOutput,
  type AskModelOutput,
  askLookupModelOutputSchema,
  askModelOutputSchema,
} from '../rules/ask-answer.schema.js';
import { retrievalQuery } from '../rules/conversation-context.js';
import { asksForPerson, isSalesInquiry } from '../rules/escalation-intent.js';
import { groundedAnswer, unknownAnswer } from '../rules/grounded-answer.js';
import { accountSources, docSources } from '../rules/prompt-sources.js';
import { AccountLookupsService } from './account-lookups.service.js';
import { AskModel } from './ask-model.js';
import { AskSpendControls } from './ask-spend-controls.js';
import { KnowledgeBaseService } from './knowledge-base.service.js';

/** What one answer needs: the question, earlier turns, and the caller's workspace if any. */
export interface AnswerInput {
  question: string;
  history: readonly AskContextTurn[];
  /** The workspace the caller may read, for account questions; null for docs only. */
  workspace: AskWorkspaceAccess | null;
  /** Whether the answer may come from and go to the cache: first, anonymous, docs-only turns. */
  cacheable: boolean;
  now: Date;
}

/** An account question: the input, the docs found, and the lookups the caller may run. */
interface AccountQuestion {
  input: AnswerInput;
  docs: readonly PromptSource[];
  workspace: AskWorkspaceAccess;
  allowed: readonly AccountLookupKind[];
}

/** How an answer was made, for the conversation log. */
interface AnswerMaking {
  cached?: boolean;
  model?: string;
  output?: AskModelOutput;
  kinds?: AccountLookupKind[];
}

/**
 * Writes one answer: from the cache, from the docs, or (for a caller signed in to a workspace)
 * also from read-only lookups of that workspace, which the model asks for in a first call and
 * reads in a second, like tools. Every model call takes from the platform's daily budget.
 */
@Injectable()
export class AskAnswerer {
  constructor(
    private readonly model: AskModel,
    private readonly knowledge: KnowledgeBaseService,
    private readonly spend: AskSpendControls,
    private readonly lookups: AccountLookupsService,
  ) {}

  async answer(input: AnswerInput): Promise<ComposedAnswer> {
    const cached = input.cacheable ? await this.spend.cachedAnswer(input.question) : null;
    if (cached) return this.composed(input.question, cached, { cached: true });
    const query = retrievalQuery(input.question, input.history);
    const retrieved = await this.knowledge.search(query, ASK_RETRIEVED_CHUNKS, input.now.getTime());
    const docs = docSources(retrieved.map((found) => found.chunk));
    const allowed = this.allowedLookups(input.workspace);
    if (input.workspace && allowed.length) {
      return this.answerWithAccount({ input, docs, workspace: input.workspace, allowed });
    }
    if (!docs.length) return this.composed(input.question, unknownAnswer(this.supportEmail));
    return this.answerFromDocs(input, docs);
  }

  private get supportEmail(): string {
    return this.model.settings.supportEmail;
  }

  private async answerFromDocs(
    input: AnswerInput,
    docs: readonly PromptSource[],
  ): Promise<ComposedAnswer> {
    const { output, model } = await this.model.generate(
      {
        ...input,
        sources: docs,
        mode: AskAccountMode.None,
        lookups: [],
        schema: askModelOutputSchema,
      },
      input.now,
    );
    const answer = groundedAnswer(output, docs, this.supportEmail);
    if (input.cacheable) await this.spend.remember(input.question, answer);
    return this.composed(input.question, answer, { model, output });
  }

  private async answerWithAccount(question: AccountQuestion): Promise<ComposedAnswer> {
    const { input, docs, workspace, allowed } = question;
    const first = await this.model.generate(
      {
        ...input,
        sources: docs,
        mode: AskAccountMode.MayLookUp,
        lookups: allowed,
        schema: askLookupModelOutputSchema,
      },
      input.now,
    );
    const requests = this.requestedLookups(first.output, allowed);
    if (!requests.length) {
      const answer = groundedAnswer(first.output, docs, this.supportEmail);
      return this.composed(input.question, answer, { model: first.model, output: first.output });
    }
    await this.spend.takeAccountQuestion(workspace.workspaceId, input.now);
    const sources = [...docs, ...accountSources(await this.lookups.run(workspace, requests))];
    const second = await this.model.generate(
      {
        ...input,
        sources,
        mode: AskAccountMode.DataGiven,
        lookups: [],
        schema: askModelOutputSchema,
      },
      input.now,
    );
    return this.composed(
      input.question,
      groundedAnswer(second.output, sources, this.supportEmail),
      {
        model: second.model,
        output: second.output,
        kinds: requests.map((request) => request.kind),
      },
    );
  }

  private allowedLookups(workspace: AskWorkspaceAccess | null): AccountLookupKind[] {
    return workspace ? this.lookups.allowed(workspace) : [];
  }

  /** The lookups the model asked for that the caller may run, each once. */
  private requestedLookups(
    output: AskLookupModelOutput,
    allowed: readonly AccountLookupKind[],
  ): AccountLookupRequest[] {
    const requests = new Map<string, AccountLookupRequest>();
    for (const { kind, query } of output.lookups) {
      if (!allowed.includes(kind)) continue;
      const trimmed = query.trim();
      requests.set(`${kind}:${trimmed}`, { kind, query: trimmed || null });
    }
    return [...requests.values()];
  }

  private composed(question: string, answer: AskAnswer, making: AnswerMaking = {}): ComposedAnswer {
    const { cached = false, model = null, output, kinds = [] } = making;
    return {
      answer,
      model,
      cached,
      lookups: kinds,
      asksForPerson: asksForPerson(question) || Boolean(output?.asksForPerson),
      salesInquiry: isSalesInquiry(question) || Boolean(output?.salesInquiry),
    };
  }
}
