import { HttpsImageFetcher, imageFileName } from './https-image-fetcher.js';
import { ImageFetchFailure } from './image-fetcher.js';

describe('HttpsImageFetcher', () => {
  const fetcher = new HttpsImageFetcher();

  it('refuses links that are not https', async () => {
    for (const url of ['http://images.example/mug.jpg', 'file:///etc/passwd', 'not a url']) {
      await expect(fetcher.fetch(url)).rejects.toMatchObject({
        failure: ImageFetchFailure.NotHttps,
        retryable: false,
      });
    }
  });

  it('refuses hosts on private addresses before connecting', async () => {
    for (const url of [
      'https://localhost/mug.jpg',
      'https://127.0.0.1/mug.jpg',
      'https://[::1]/mug.jpg',
      'https://169.254.169.254/latest/meta-data',
    ]) {
      await expect(fetcher.fetch(url)).rejects.toMatchObject({
        failure: ImageFetchFailure.PrivateAddress,
      });
    }
  });

  it('never names the URL in its error', async () => {
    const error = await fetcher
      .fetch('https://127.0.0.1/mug.jpg?signature=secret-detail')
      .catch((caught: unknown) => caught);

    expect(String(error)).not.toContain('secret-detail');
  });
});

describe('imageFileName', () => {
  it('uses the last path segment, or a name from the media type', () => {
    expect(imageFileName(new URL('https://cdn.example/a/mug%201.png?v=2'), 'image/png')).toBe(
      'mug 1.png',
    );
    expect(imageFileName(new URL('https://cdn.example/a/123'), 'image/webp')).toBe('image.webp');
  });
});
