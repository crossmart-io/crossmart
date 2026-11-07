import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiPaymentRequiredResponse, getSchemaPath } from '@nestjs/swagger';
import { PlanLimitErrorDto } from '../dto/plan-limit-error.dto.js';
import { SubscriptionInactiveErrorDto } from '../dto/subscription-inactive-error.dto.js';
import { PLAN_LIMIT_RESPONSE_DESCRIPTION } from '../entitlements.constants.js';

/**
 * Documents the 402 a route answers when the organization's plan does not allow the action, or
 * (where billing is on) when the organization is read-only for its subscription.
 */
export const ApiPlanLimitResponse = (): MethodDecorator & ClassDecorator =>
  applyDecorators(
    ApiExtraModels(PlanLimitErrorDto, SubscriptionInactiveErrorDto),
    ApiPaymentRequiredResponse({
      description: PLAN_LIMIT_RESPONSE_DESCRIPTION,
      schema: {
        oneOf: [
          { $ref: getSchemaPath(PlanLimitErrorDto) },
          { $ref: getSchemaPath(SubscriptionInactiveErrorDto) },
        ],
      },
    }),
  );
