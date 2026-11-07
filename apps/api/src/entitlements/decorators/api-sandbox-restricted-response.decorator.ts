import { ApiForbiddenResponse } from '@nestjs/swagger';
import { SandboxRestrictedErrorDto } from '../dto/sandbox-restricted-error.dto.js';
import { SANDBOX_RESTRICTED_RESPONSE_DESCRIPTION } from '../entitlements.constants.js';

/** Documents the 403 a route answers in an unclaimed sandbox account, which cannot do it yet. */
export const ApiSandboxRestrictedResponse = (): MethodDecorator & ClassDecorator =>
  ApiForbiddenResponse({
    type: SandboxRestrictedErrorDto,
    description: SANDBOX_RESTRICTED_RESPONSE_DESCRIPTION,
  });
