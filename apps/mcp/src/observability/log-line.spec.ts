import { logLine } from './log-line.js';

describe('logLine', () => {
  it('writes key=value pairs in order and leaves absent values out', () => {
    expect(logLine({ event: 'tool_call', items: 0, code: undefined, url: 'https://a.b/c' })).toBe(
      'event=tool_call items=0 url=https://a.b/c',
    );
  });

  it('quotes a value with spaces, quotes or line breaks, so it cannot forge a field or a line', () => {
    expect(logLine({ client: 'Claude Code', evil: 'a\nb="c"' })).toBe(
      'client="Claude Code" evil="a\\nb=\\"c\\""',
    );
  });
});
