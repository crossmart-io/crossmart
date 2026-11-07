import type { MailMessage } from '@crossmart/common';
import { renderEmail } from './email-layout.js';

/** One question and answer of an escalated conversation, as the team reads it. */
export interface EscalatedTurn {
  question: string;
  answer: string;
  outcome: string;
}

export interface AskEscalationOpenedEmailInput {
  to: string;
  reason: string;
  channel: string;
  callerType: string;
  clientName: string | null;
  contactEmail: string | null;
  hasCallback: boolean;
  turns: readonly EscalatedTurn[];
  /** The conversation in the admin area of the web app. */
  url: string;
}

const NONE = 'none';

function turnParagraphs(turns: readonly EscalatedTurn[]): string[] {
  return turns.flatMap((turn, index) => [
    `Q${index + 1}: ${turn.question}`,
    `A${index + 1} (${turn.outcome}): ${turn.answer}`,
  ]);
}

/** To the Crossmart team: someone asked Ask Crossmart for a person, with the whole conversation. */
export function askEscalationOpenedEmail(input: AskEscalationOpenedEmailInput): MailMessage {
  const caller = input.clientName ? `${input.callerType} (${input.clientName})` : input.callerType;
  return renderEmail({
    to: input.to,
    subject: `Ask Crossmart: a conversation was escalated (${input.reason})`,
    heading: 'A conversation needs a person',
    paragraphs: [
      `Reason: ${input.reason}. Channel: ${input.channel}. Caller: ${caller}.`,
      `Contact email: ${input.contactEmail ?? NONE}. Callback: ${input.hasCallback ? 'yes' : 'no'}.`,
      ...turnParagraphs(input.turns),
      'Reply from the admin area: the reply goes to the contact email and the callback, and the asker can read it with their ticket id.',
    ],
    action: { label: 'Open the conversation', url: input.url },
    footer: 'You receive this because this address is ASK_ESCALATION_EMAIL.',
  });
}

export interface AskEscalationReplyEmailInput {
  to: string;
  reply: string;
  /** Where to ask more. */
  url: string;
}

/** To the person who asked: the team's reply to their escalated question. */
export function askEscalationReplyEmail(input: AskEscalationReplyEmailInput): MailMessage {
  return renderEmail({
    to: input.to,
    subject: 'Crossmart replied to your question',
    heading: 'A reply from the Crossmart team',
    paragraphs: [input.reply],
    action: { label: 'Read the Crossmart docs', url: input.url },
    footer: 'You receive this because you asked Ask Crossmart for a person and left this address.',
  });
}
