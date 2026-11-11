import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '@crossmart/connectors';
import {
  type GettingStarted,
  GettingStartedStep,
  GettingStartedStepOwner,
  GettingStartedStepState,
  type GettingStartedStepView,
  type StoreConnectLink,
} from '@crossmart/core';
import { CHANNEL_TYPE_SCHEMA_NAME } from '../../channels/channels.constants.js';
import {
  GETTING_STARTED_STEP_OWNER_SCHEMA_NAME,
  GETTING_STARTED_STEP_SCHEMA_NAME,
  GETTING_STARTED_STEP_STATE_SCHEMA_NAME,
} from '../getting-started.constants.js';

export class GettingStartedStepDto implements GettingStartedStepView {
  @ApiProperty({ enum: GettingStartedStep, enumName: GETTING_STARTED_STEP_SCHEMA_NAME })
  step: GettingStartedStep;

  @ApiProperty({ enum: GettingStartedStepState, enumName: GETTING_STARTED_STEP_STATE_SCHEMA_NAME })
  state: GettingStartedStepState;

  @ApiProperty({
    enum: GettingStartedStepOwner,
    enumName: GETTING_STARTED_STEP_OWNER_SCHEMA_NAME,
    description: '`merchant`: only the seller can take it, in the app; `agent`: with `tools`',
  })
  owner: GettingStartedStepOwner;

  @ApiProperty({ example: 'Connect a store' })
  title: string;

  @ApiProperty()
  detail: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The page of the web app where the seller takes it',
  })
  url: string | null;

  @ApiProperty({ type: [String], example: ['create_product'], description: 'Agent tools' })
  tools: string[];
}

export class StoreConnectLinkDto implements StoreConnectLink {
  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty({ description: 'Opens the Stores page with this channel’s connect dialog' })
  url: string;
}

/** Where a new account stands, and what to do next. */
export class GettingStartedDto implements GettingStarted {
  @ApiProperty({ description: 'Whether the caller (or the key’s creator) confirmed their email' })
  emailVerified: boolean;

  @ApiProperty({ description: 'An account an AI agent opened that nobody has claimed yet' })
  unclaimedSandbox: boolean;

  @ApiProperty()
  products: number;

  @ApiProperty({ description: 'Stores that are not disconnected' })
  connectedStores: number;

  @ApiProperty({ description: 'Listings live on a store' })
  liveListings: number;

  @ApiProperty({ description: 'Outside agents’ changes waiting for approval' })
  pendingProposals: number;

  @ApiProperty({ description: 'Whether outside agents’ changes wait for the seller’s approval' })
  agentChangesNeedApproval: boolean;

  @ApiProperty({
    enum: GettingStartedStep,
    enumName: GETTING_STARTED_STEP_SCHEMA_NAME,
    nullable: true,
    description: 'The first step still to take; null once every step is done',
  })
  nextStep: GettingStartedStep | null;

  @ApiProperty({ type: [GettingStartedStepDto], description: 'The steps that apply, in order' })
  steps: GettingStartedStepDto[];

  @ApiProperty({ type: [StoreConnectLinkDto] })
  connectStoreLinks: StoreConnectLinkDto[];

  static from(view: GettingStarted): GettingStartedDto {
    return Object.assign(new GettingStartedDto(), view);
  }
}
