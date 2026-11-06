import { NotFoundException } from '@nestjs/common';
import { WebhookDisabledReason, type WebhookEndpoint } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { EntitlementExceededException } from '../../entitlements/errors/entitlement-exceeded.exception.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import type { WebhookEndpointRepository } from '../repositories/webhook-endpoint.repository.js';
import {
  storedEndpoint,
  TEST_ENDPOINT_ID,
  TEST_ENDPOINT_URL,
  TEST_WORKSPACE_ID,
} from '../testing/webhook-fixtures.js';
import {
  WEBHOOK_ENDPOINT_NOT_FOUND,
  WEBHOOK_SECRET_ROTATION_GRACE_MS,
} from '../webhooks.constants.js';
import { WebhookEndpointAdmission } from './webhook-endpoint.admission.js';
import { WebhookEndpointsService } from './webhook-endpoints.service.js';
import type { WebhookSecretVault } from './webhook-secret.vault.js';
import type { WebhookUrlPolicy } from './webhook-url.policy.js';

const ACTOR = Actor.user('user-1');
const SECRET = 'whsec_plain-secret';
const SEALED = 'sealed-new-secret';
const NORMALIZED_URL = 'https://hooks.example.com/normalized';

function fakeRepository(current: WebhookEndpoint, exists: boolean) {
  const found = exists ? current : null;
  return {
    create: vi
      .fn<WebhookEndpointRepository['create']>()
      .mockImplementation((data) =>
        Promise.resolve(storedEndpoint(data as Partial<WebhookEndpoint>)),
      ),
    list: vi.fn<WebhookEndpointRepository['list']>().mockResolvedValue(exists ? [current] : []),
    find: vi.fn<WebhookEndpointRepository['find']>().mockResolvedValue(found),
    update: vi.fn<WebhookEndpointRepository['update']>().mockResolvedValue(found),
    delete: vi.fn<WebhookEndpointRepository['delete']>().mockResolvedValue(exists),
    disable: vi.fn<WebhookEndpointRepository['disable']>().mockResolvedValue(true),
    updateAndTurnOff: vi
      .fn<WebhookEndpointRepository['updateAndTurnOff']>()
      .mockResolvedValue(found),
  };
}

function createService(current: WebhookEndpoint = storedEndpoint(), exists = true) {
  const calls: string[] = [];
  const repository = fakeRepository(current, exists);
  const assertAllowed = vi.fn<WebhookUrlPolicy['assertAllowed']>().mockImplementation(() => {
    calls.push('url');
    return Promise.resolve(NORMALIZED_URL);
  });
  const assertInWorkspace = vi
    .fn<EntitlementService['assertInWorkspace']>()
    .mockImplementation(() => {
      calls.push('entitlement');
      return Promise.resolve();
    });
  const vault = {
    generate: vi.fn<WebhookSecretVault['generate']>().mockReturnValue(SECRET),
    seal: vi.fn<WebhookSecretVault['seal']>().mockResolvedValue(SEALED),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new WebhookEndpointsService(
    repository as unknown as WebhookEndpointRepository,
    vault as unknown as WebhookSecretVault,
    new WebhookEndpointAdmission(
      { assertAllowed } as unknown as WebhookUrlPolicy,
      { assertInWorkspace } as unknown as EntitlementService,
    ),
    activity,
  );
  return { service, repository, vault, activity, calls, assertAllowed, assertInWorkspace };
}

const NEW_ENDPOINT = {
  url: 'https://Hooks.Example.com/normalized',
  eventTypes: [
    WebhookEventType.OrderCreated,
    WebhookEventType.OrderCreated,
    WebhookEventType.ProductUpdated,
  ],
};

describe('WebhookEndpointsService.create', () => {
  it('checks the URL, then the plan, and stores the endpoint with a sealed secret', async () => {
    const { service, repository, vault, calls, assertInWorkspace } = createService();

    await service.create(TEST_WORKSPACE_ID, NEW_ENDPOINT, ACTOR);

    expect(calls).toEqual(['url', 'entitlement']);
    expect(assertInWorkspace).toHaveBeenCalledWith(TEST_WORKSPACE_ID, Feature.WebhookEndpoints);
    const [record] = repository.create.mock.calls[0] ?? [];
    expect(record).toMatchObject({
      workspaceId: TEST_WORKSPACE_ID,
      url: NORMALIZED_URL,
      description: null,
      eventTypes: [WebhookEventType.OrderCreated, WebhookEventType.ProductUpdated],
      sealedSecret: SEALED,
    });
    expect(JSON.stringify(record)).not.toContain(SECRET);
    expect(vault.seal).toHaveBeenCalledWith(
      { workspaceId: TEST_WORKSPACE_ID, endpointId: record?.id },
      SECRET,
    );
  });

  it('returns the secret once, records the URL as the label, and shows no secret field', async () => {
    const { service, activity } = createService();

    const { endpoint, secret } = await service.create(TEST_WORKSPACE_ID, NEW_ENDPOINT, ACTOR);

    expect(secret).toBe(SECRET);
    expect(endpoint).not.toHaveProperty('sealedSecret');
    expect(endpoint).not.toHaveProperty('previousSealedSecret');
    expect(endpoint.enabled).toBe(true);
    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.WebhookEndpointCreated,
        subject: {
          type: ActivitySubjectType.WebhookEndpoint,
          id: endpoint.id,
          label: NORMALIZED_URL,
        },
      }),
    ]);
    expect(JSON.stringify(activity.recorded)).not.toContain(SECRET);
  });

  it('stores nothing when the plan has no room for another endpoint', async () => {
    const { service, repository, assertInWorkspace, activity } = createService();
    assertInWorkspace.mockRejectedValue(planLimitReached(Feature.WebhookEndpoints));

    await expect(service.create(TEST_WORKSPACE_ID, NEW_ENDPOINT, ACTOR)).rejects.toThrow(
      EntitlementExceededException,
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(activity.entries).toHaveLength(0);
  });
});

describe('WebhookEndpointsService.update', () => {
  it('checks the URL only when a new one is given', async () => {
    const { service, repository, assertAllowed } = createService();

    await service.update(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, { description: 'ERP' }, ACTOR);
    expect(assertAllowed).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenLastCalledWith(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, {
      description: 'ERP',
    });

    await service.update(
      TEST_WORKSPACE_ID,
      TEST_ENDPOINT_ID,
      { url: 'https://new.example' },
      ACTOR,
    );
    expect(assertAllowed).toHaveBeenCalledWith('https://new.example');
    expect(repository.update).toHaveBeenLastCalledWith(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, {
      url: NORMALIZED_URL,
    });
  });

  it('turns an enabled endpoint off as a manual disable', async () => {
    const { service, repository, activity } = createService();

    await service.update(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, { enabled: false }, ACTOR);

    expect(repository.updateAndTurnOff).toHaveBeenCalledWith(
      TEST_WORKSPACE_ID,
      TEST_ENDPOINT_ID,
      {},
      expect.any(Date),
    );
    expect(repository.update).not.toHaveBeenCalled();
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.WebhookEndpointUpdated,
      detail: 'turned off',
    });
  });

  it('turns a disabled endpoint on and clears its failures', async () => {
    const disabled = storedEndpoint({
      disabledReason: WebhookDisabledReason.FAILING,
      disabledAt: new Date(),
      consecutiveFailures: 30,
    });
    const { service, repository, activity } = createService(disabled);

    await service.update(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, { enabled: true }, ACTOR);

    expect(repository.updateAndTurnOff).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, {
      disabledReason: null,
      disabledAt: null,
      consecutiveFailures: 0,
    });
    expect(activity.entries[0]?.detail).toBe('turned on');
  });

  it('records no toggle when the endpoint is already in the asked state', async () => {
    const { service, repository, activity } = createService();

    await service.update(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, { enabled: true }, ACTOR);

    expect(repository.updateAndTurnOff).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, {});
    expect(activity.entries[0]?.detail).toBeUndefined();
  });
});

describe('WebhookEndpointsService.rotateSecret', () => {
  it('keeps the old sealed secret for the grace period and returns the new secret', async () => {
    const current = storedEndpoint({ sealedSecret: 'sealed:old' });
    const { service, repository, activity } = createService(current);
    const before = Date.now();

    const { secret } = await service.rotateSecret(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, ACTOR);

    const changes = repository.update.mock.calls[0]?.[2];
    expect(secret).toBe(SECRET);
    expect(changes).toMatchObject({ sealedSecret: SEALED, previousSealedSecret: 'sealed:old' });
    const expiresAt = (changes?.previousSecretExpiresAt as Date | undefined)?.getTime() ?? 0;
    expect(expiresAt).toBeGreaterThanOrEqual(before + WEBHOOK_SECRET_ROTATION_GRACE_MS);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + WEBHOOK_SECRET_ROTATION_GRACE_MS);
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.WebhookSecretRotated,
      subject: { label: TEST_ENDPOINT_URL },
    });
    expect(JSON.stringify(activity.recorded)).not.toContain(SECRET);
  });
});

describe('WebhookEndpointsService outside the workspace', () => {
  it('answers 404 for an endpoint the workspace does not have', async () => {
    const { service, repository, activity } = createService(storedEndpoint(), false);

    await expect(service.get(TEST_WORKSPACE_ID, 'other')).rejects.toThrow(NotFoundException);
    await expect(service.delete(TEST_WORKSPACE_ID, 'other', ACTOR)).rejects.toThrow(
      WEBHOOK_ENDPOINT_NOT_FOUND,
    );
    await expect(
      service.update(TEST_WORKSPACE_ID, 'other', { enabled: false }, ACTOR),
    ).rejects.toThrow(NotFoundException);
    await expect(service.rotateSecret(TEST_WORKSPACE_ID, 'other', ACTOR)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
    expect(repository.updateAndTurnOff).not.toHaveBeenCalled();
    expect(activity.entries).toHaveLength(0);
  });

  it('deletes an endpoint of the workspace and records it', async () => {
    const { service, repository, activity } = createService();

    await service.delete(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID, ACTOR);

    expect(repository.delete).toHaveBeenCalledWith(TEST_WORKSPACE_ID, TEST_ENDPOINT_ID);
    expect(activity.entries[0]).toMatchObject({ action: ActivityAction.WebhookEndpointDeleted });
  });
});
