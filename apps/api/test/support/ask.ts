import { randomUUID } from 'node:crypto';
import { AskConfidence, AskOutcome } from '@crossmart/core';

/** The header Railway's edge sets to the caller's address; Ask counts anonymous callers by it. */
export const CLIENT_IP_HEADER = 'x-real-ip';
export const USER_AGENT = 'user-agent';

/** A model answer citing the first source, as the fake AI provider returns it. */
export const CITED_ANSWER = {
  outcome: AskOutcome.Answered,
  answer: 'Past a limit the API answers 429 with a Retry-After header.',
  sourceIds: ['S1'],
  confidence: AskConfidence.High,
  asksForPerson: false,
  salesInquiry: false,
  lookups: [],
};

/** A model answer saying the sources do not answer, so a person is offered. */
export const UNKNOWN_ANSWER = {
  ...CITED_ANSWER,
  outcome: AskOutcome.Unknown,
  answer: 'I do not know.',
  sourceIds: [],
  confidence: AskConfidence.Low,
};

/** A fresh address per test, so rate-limit windows in Redis never carry over between runs. */
export function randomIp(): string {
  const bytes = randomUUID().replaceAll('-', '').slice(0, 6);
  return `10.${parseInt(bytes.slice(0, 2), 16)}.${parseInt(bytes.slice(2, 4), 16)}.${parseInt(bytes.slice(4, 6), 16)}`;
}
