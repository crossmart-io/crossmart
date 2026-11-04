import { RESEND_EMAILS_URL } from './mail.constants.js';
import { MailDeliveryError, ResendMailSender } from './resend-mail-sender.js';

const MESSAGE = { to: 'ana@example.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ResendMailSender', () => {
  it('posts the email from the configured sender with the key as a bearer token', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"id":"e-1"}'));
    vi.stubGlobal('fetch', fetchMock);

    await new ResendMailSender('re_key', 'Crossmart <hello@crossmart.io>').send(MESSAGE);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(RESEND_EMAILS_URL);
    expect(init?.headers).toMatchObject({ authorization: 'Bearer re_key' });
    expect(JSON.parse(String(init?.body))).toEqual({
      from: 'Crossmart <hello@crossmart.io>',
      ...MESSAGE,
    });
  });

  it('fails loudly when Resend refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('domain not verified', { status: 403 })),
    );
    await expect(new ResendMailSender('re_key', 'x@y.z').send(MESSAGE)).rejects.toBeInstanceOf(
      MailDeliveryError,
    );
  });
});
