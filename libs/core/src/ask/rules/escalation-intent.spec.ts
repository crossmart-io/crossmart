import { asksForPerson, isSalesInquiry } from './escalation-intent.js';

describe('asksForPerson', () => {
  it.each([
    'Can I talk to a human?',
    'I want to speak with someone from your team',
    'contact support',
    'אפשר לדבר עם נציג?',
  ])('recognises "%s"', (question) => {
    expect(asksForPerson(question)).toBe(true);
  });

  it('ignores questions about people in general', () => {
    expect(asksForPerson('How many people can join a workspace?')).toBe(false);
  });
});

describe('isSalesInquiry', () => {
  it.each([
    'Do you have enterprise pricing?',
    'Can I book a demo?',
    'We want custom contract terms',
  ])('recognises "%s"', (question) => {
    expect(isSalesInquiry(question)).toBe(true);
  });

  it('ignores ordinary plan questions', () => {
    expect(isSalesInquiry('What does the Starter plan include?')).toBe(false);
  });
});
