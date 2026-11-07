import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingPlansService } from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import { BILLING_PLANS_ROUTE, BILLING_TAG } from '../billing.constants.js';
import { BillingPlanCatalogDto } from '../dto/billing-plan.dto.js';

/** The plan lineup with prices, for pricing pages in the app and on the website. */
@ApiTags(BILLING_TAG)
@Controller(BILLING_PLANS_ROUTE)
export class BillingPlansController {
  constructor(private readonly plans: BillingPlansService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'The plans on offer, with what each includes and costs',
    description:
      'Open to anyone. Prices come from the billing provider, monthly and annual; a plan with ' +
      'none (Enterprise, or every plan on a self-hosted instance) is not self-serve and is sold ' +
      'through `salesEmail`. No plan charges a fee on sales.',
  })
  @ApiOkResponse({ type: BillingPlanCatalogDto })
  async list(): Promise<BillingPlanCatalogDto> {
    return BillingPlanCatalogDto.from(await this.plans.catalog());
  }
}
