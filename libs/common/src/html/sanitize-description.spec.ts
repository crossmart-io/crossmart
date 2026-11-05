import { sanitizeDescriptionHtml, toPlainText } from './sanitize-description.js';

describe('sanitizeDescriptionHtml', () => {
  it('keeps product formatting', () => {
    const html = '<p>Soft <strong>merino</strong></p><ul><li>Regular fit</li></ul>';
    expect(sanitizeDescriptionHtml(html)).toBe(html);
  });

  it('removes scripts, handlers and javascript links', () => {
    const html =
      '<p onclick="steal()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)>';
    expect(sanitizeDescriptionHtml(html)).toBe(
      '<p>Hi</p><a rel="noopener noreferrer nofollow">x</a>',
    );
  });

  it('marks links as nofollow', () => {
    expect(sanitizeDescriptionHtml('<a href="https://example.com">site</a>')).toContain(
      'rel="noopener noreferrer nofollow"',
    );
  });
});

describe('sanitizeDescriptionHtml without links', () => {
  it('keeps the link text and drops the link', () => {
    expect(
      sanitizeDescriptionHtml('<p>See <a href="https://example.com">our shop</a></p>', {
        allowLinks: false,
      }),
    ).toBe('<p>See our shop</p>');
  });
});

describe('toPlainText', () => {
  it('drops markup, collapses whitespace and keeps ampersands as typed', () => {
    expect(toPlainText(' <b>Tom & Jerry</b>\n  Mug ')).toBe('Tom & Jerry Mug');
  });
});
