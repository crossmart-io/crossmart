import { ApiPaymentRequiredResponse } from '@nestjs/swagger';
import { PlanLimitErrorDto } from '../dto/plan-limit-error.dto.js';
import { PLAN_LIMIT_RESPONSE_DESCRIPTION } from '../entitlements.constants.js';

/** Documents the 402 a route answers when the organization's plan does not allow the action. */
export const ApiPlanLimitResponse = (): MethodDecorator & ClassDecorator =>
  ApiPaymentRequiredResponse({
    type: PlanLimitErrorDto,
    description: PLAN_LIMIT_RESPONSE_DESCRIPTION,
  });
