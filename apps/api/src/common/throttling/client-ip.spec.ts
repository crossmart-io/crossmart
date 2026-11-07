import type { Request } from 'express';
import { clientIp } from './client-ip.js';

function request(headers: Record<string, string>, ip?: string): Request {
  return { header: (name: string) => headers[name], ip } as unknown as Request;
}

describe('clientIp', () => {
  it('reads the address the edge proxy reports, trimmed', () => {
    expect(clientIp(request({ 'x-real-ip': ' 203.0.113.7 ' }, '10.0.0.9'))).toBe('203.0.113.7');
  });

  it('falls back to the socket’s address, then to a shared unknown one', () => {
    expect(clientIp(request({}, '10.0.0.9'))).toBe('10.0.0.9');
    expect(clientIp(request({}))).toBe('unknown');
  });
});
