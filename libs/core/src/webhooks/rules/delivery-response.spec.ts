import { WebhookDeliveryFailure } from '../enums/webhook-delivery-failure.enum.js';
import { resultOfFailure, resultOfStatus } from './delivery-response.js';

describe('resultOfStatus', () => {
  it('counts every 2xx answer as a success', () => {
    for (const status of [200, 201, 204, 299]) {
      expect(resultOfStatus(status, 15)).toEqual({
        succeeded: true,
        responseStatus: status,
        durationMs: 15,
        error: null,
      });
    }
  });

  it('counts a 3xx answer as a redirect that is not followed', () => {
    for (const status of [300, 301, 302, 307, 308, 399]) {
      expect(resultOfStatus(status, 15)).toMatchObject({
        succeeded: false,
        responseStatus: status,
        error: WebhookDeliveryFailure.Redirect,
      });
    }
  });

  it('names the status of any other answer', () => {
    expect(resultOfStatus(404, 15).error).toBe('The endpoint answered with HTTP 404');
    expect(resultOfStatus(503, 15).error).toBe('The endpoint answered with HTTP 503');
    expect(resultOfStatus(199, 15)).toMatchObject({ succeeded: false, responseStatus: 199 });
  });
});

describe('resultOfFailure', () => {
  it('reports no status and the failure in safe words', () => {
    expect(resultOfFailure(WebhookDeliveryFailure.Timeout, 10_000)).toEqual({
      succeeded: false,
      responseStatus: null,
      durationMs: 10_000,
      error: WebhookDeliveryFailure.Timeout,
    });
  });
});
