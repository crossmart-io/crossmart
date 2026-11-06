import { multipartBody } from './multipart-body.js';

describe('multipartBody', () => {
  it('encodes text fields and files between boundaries', async () => {
    const image = {
      bytes: Buffer.from([0xff, 0xd8, 0xff]),
      fileName: 'a"b.jpg',
      contentType: 'image/jpeg',
    };

    const body = multipartBody({ rank: '1', image }, 'BOUNDARY');

    expect(body.contentType).toBe('multipart/form-data; boundary=BOUNDARY');
    const form = await new Response(body.bytes, {
      headers: { 'content-type': body.contentType },
    }).formData();
    expect(form.get('rank')).toBe('1');
    const file = form.get('image');
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe('a_b.jpg');
    expect((file as File).type).toBe('image/jpeg');
    expect(Buffer.from(await (file as File).arrayBuffer())).toEqual(
      Buffer.from([0xff, 0xd8, 0xff]),
    );
  });

  it('picks a random boundary by default', () => {
    const first = multipartBody({ rank: '1' }).contentType;
    const second = multipartBody({ rank: '1' }).contentType;

    expect(first).not.toBe(second);
  });
});
