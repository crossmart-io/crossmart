const TRUNCATION_NOTE = '\n[cut: the rest is not shown]';

/** At most `maxLength` characters, saying so when something was cut. */
export function truncateWithNote(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - TRUNCATION_NOTE.length)}${TRUNCATION_NOTE}`;
}
