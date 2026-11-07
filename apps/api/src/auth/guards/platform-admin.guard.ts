import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type { AuthenticatedRequest } from '../entities/principal.js';
import { isPlatformAdmin } from '../platform-admin.js';

const NOT_FOUND = 'Not found';

/**
 * Lets only platform admins (`PLATFORM_ADMIN_EMAILS`, verified) through. Everyone else gets
 * 404, so the admin routes do not show they exist.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  private readonly adminEmails: ReadonlySet<string>;

  constructor(config: AppConfigService) {
    this.adminEmails = config.platformAdminEmails;
  }

  canActivate(context: ExecutionContext): boolean {
    const { principal } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!isPlatformAdmin(principal, this.adminEmails)) throw new NotFoundException(NOT_FOUND);
    return true;
  }
}
