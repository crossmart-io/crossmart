import {
  descriptionToPlainText,
  sanitizeDescriptionHtml,
  toPlainText,
} from './sanitize-description.js';

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

describe('descriptionToPlainText', () => {
  it('keeps paragraphs and list items on their own lines, inline tags without extra spaces', () => {
    const html =
      '<p>Breathable <strong>linen</strong>.</p><ul><li>100% linen</li><li>Made in Portugal</li></ul><p>Wash cold &amp; dry flat.</p>';

    expect(descriptionToPlainText(html)).toBe(
      'Breathable linen.\n\n100% linen\nMade in Portugal\n\nWash cold & dry flat.',
    );
  });

  it('drops scripts and styles with their content, and collapses spaces', () => {
    expect(
      descriptionToPlainText(
        '<p>Hi&nbsp;&nbsp; there</p><script>alert(1)</script><style>p{}</style>',
      ),
    ).toBe('Hi there');
  });

  it('leaves plain text as it is', () => {
    expect(descriptionToPlainText('Tom & Jerry mug')).toBe('Tom & Jerry mug');
  });
});
