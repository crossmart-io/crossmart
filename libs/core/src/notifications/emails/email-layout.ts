import { escapeHtml, type MailMessage } from '@crossmart/common';

export interface EmailContent {
  to: string;
  subject: string;
  heading: string;
  /** Plain sentences; they are escaped for the HTML part. */
  paragraphs: string[];
  action: { label: string; url: string };
  /** A closing line, such as why the email was sent. */
  footer: string;
}

const BRAND_COLOR = '#2a4bd7';

function paragraphHtml(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#1f2328">${escapeHtml(text)}</p>`;
}

function buttonHtml({ label, url }: EmailContent['action']): string {
  return (
    `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="display:inline-block;` +
    `padding:10px 18px;border-radius:8px;background:${BRAND_COLOR};color:#ffffff;` +
    `font-size:15px;font-weight:600;text-decoration:none">${escapeHtml(label)}</a></p>`
  );
}

/** One plain transactional email: a heading, a few sentences, one button, and the same as text. */
export function renderEmail(content: EmailContent): MailMessage {
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;` +
    `margin:0 auto;padding:32px 24px">` +
    `<p style="margin:0 0 24px;font-size:16px;font-weight:700;color:#1f2328">crossmart</p>` +
    `<h1 style="margin:0 0 16px;font-size:20px;color:#1f2328">${escapeHtml(content.heading)}</h1>` +
    content.paragraphs.map(paragraphHtml).join('') +
    buttonHtml(content.action) +
    `<p style="margin:0 0 8px;font-size:13px;color:#59636e">If the button does not work, open ` +
    `this link:<br>${escapeHtml(content.action.url)}</p>` +
    `<p style="margin:24px 0 0;font-size:13px;color:#59636e">${escapeHtml(content.footer)}</p>` +
    `</div>`;
  const text = [
    content.heading,
    ...content.paragraphs,
    `${content.action.label}: ${content.action.url}`,
    content.footer,
  ].join('\n\n');
  return { to: content.to, subject: content.subject, html, text };
}
