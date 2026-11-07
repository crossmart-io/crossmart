import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type { AskEscalation } from '@crossmart/database';
import { AskEmailsService } from '../../notifications/services/ask-emails.service.js';
import { ASK_ADMIN_CONVERSATION_PATH, DOCS_URL } from '../ask.constants.js';
import type { AskConversationWithTurns } from '../repositories/ask-insights.repository.js';
import { AskEscalationCallback, type RepliedEscalation } from './ask-escalation.callback.js';

const PATH_SEPARATOR = '/';

function isReplied(escalation: AskEscalation): escalation is RepliedEscalation {
  return escalation.reply !== null && escalation.repliedAt !== null;
}

/**
 * Tells people about escalations: the team when one opens (with the whole conversation), and
 * the asker when a platform admin replies, by email and by the signed callback.
 */
@Injectable()
export class AskEscalationNotifier {
  constructor(
    private readonly emails: AskEmailsService,
    private readonly callback: AskEscalationCallback,
    private readonly config: AppConfigService,
  ) {}

  /** Emails `ASK_ESCALATION_EMAIL` the conversation, without waiting for the mail provider. */
  teamNeeded(escalation: AskEscalation, conversation: AskConversationWithTurns): void {
    this.emails.sendEscalationOpened({
      to: this.config.askSettings.escalationEmail,
      reason: escalation.reason,
      channel: conversation.channel,
      callerType: conversation.callerType,
      clientName: conversation.clientName,
      contactEmail: escalation.contactEmail,
      hasCallback: escalation.callbackUrl !== null,
      turns: conversation.turns,
      url: [this.config.webAppUrl + ASK_ADMIN_CONVERSATION_PATH, conversation.id].join(
        PATH_SEPARATOR,
      ),
    });
  }

  /** Sends the reply to the contact email and the callback. */
  async replied(escalation: AskEscalation, conversationId: string): Promise<void> {
    if (!isReplied(escalation)) return;
    if (escalation.contactEmail) {
      this.emails.sendEscalationReply({
        to: escalation.contactEmail,
        reply: escalation.reply,
        url: DOCS_URL,
      });
    }
    if (escalation.callbackUrl) {
      await this.callback.deliver(escalation, escalation.callbackUrl, conversationId);
    }
  }
}
