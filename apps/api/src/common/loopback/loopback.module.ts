import { Module } from '@nestjs/common';
import { LoopbackApi } from './loopback-api.js';

/** Lets the API call itself over loopback, for agents' tool calls made inside the server. */
@Module({ providers: [LoopbackApi], exports: [LoopbackApi] })
export class LoopbackModule {}
