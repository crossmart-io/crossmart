import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TenancyModule } from '@crossmart/core';
import { AuthenticationGuard } from './guards/authentication.guard.js';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard.js';
import { AuthService } from './services/auth.service.js';

/** Sessions (Better Auth), API keys and the global guards. Guards run in the order listed. */
@Module({
  imports: [TenancyModule],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: WorkspaceAccessGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
