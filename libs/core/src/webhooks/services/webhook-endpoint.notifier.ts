import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ActivityOutcome } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { WebhookEmailsService } from '../../notifications/services/webhook-emails.service.js';
import { WebhookRecipientRepository } from '../repositories/webhook-recipient.repository.js';
import { WEBHOOK_SETTINGS_PATH } from '../webhooks.constants.js';

/** An endpoint Crossmart turned off, as the notice names it. */
export interface DisabledEndpoint {
  id: string;
  workspaceId: string;
  url: string;
  failures: number;
}

/** Tells the workspace an endpoint was turned off: in its activity log, and by email. */
@Injectable()
export class WebhookEndpointNotifier {
  constructor(
    private readonly activity: ActivityRecorder,
    private readonly recipients: WebhookRecipientRepository,
    private readonly emails: WebhookEmailsService,
    private readonly appConfig: AppConfigService,
  ) {}

  async endpointDisabled(endpoint: DisabledEndpoint): Promise<void> {
    const reason = `${endpoint.failures} delivery attempts failed in a row`;
    await this.activity.record(endpoint.workspaceId, Actor.system(), {
      action: ActivityAction.WebhookEndpointDisabled,
      outcome: ActivityOutcome.FAILED,
      subject: { type: ActivitySubjectType.WebhookEndpoint, id: endpoint.id, label: endpoint.url },
      detail: reason,
      failureReason: reason,
    });
    await this.email(endpoint);
  }

  private async email(endpoint: DisabledEndpoint): Promise<void> {
    const audience = await this.recipients.findAudience(endpoint.workspaceId);
    if (!audience) return;
    const url = new URL(WEBHOOK_SETTINGS_PATH, this.appConfig.webAppUrl).toString();
    for (const to of audience.emails) {
      this.emails.sendEndpointDisabled({
        to,
        workspaceName: audience.workspaceName,
        endpointUrl: endpoint.url,
        failures: endpoint.failures,
        url,
      });
    }
  }
}
