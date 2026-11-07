import { z } from 'zod';
import {
  ASK_CALLBACK_URL_MAX_LENGTH,
  ASK_QUESTION_MAX_LENGTH,
  ASK_TOKEN_MAX_LENGTH,
  AskEscalationReason,
} from '@crossmart/core';
import { A2A_ESCALATE_ACTION, A2A_MAX_PAGE_SIZE, JSON_RPC_VERSION } from '../a2a.constants.js';
import { A2aRole } from '../enums/a2a-role.enum.js';
import { A2aTaskState } from '../enums/a2a-task-state.enum.js';

const ID_MAX_LENGTH = 200;
const PARTS_MAX = 20;

/** A JSON-RPC 2.0 request (§9.3). `params` is checked per method. */
export const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal(JSON_RPC_VERSION),
  id: z.union([z.string().max(ID_MAX_LENGTH), z.number(), z.null()]).optional(),
  method: z.string().min(1).max(ID_MAX_LENGTH),
  params: z.unknown().optional(),
});
export type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>;

/** A part as a client may send it: exactly one of text, raw, url or data. */
const partSchema = z
  .object({
    text: z.string().max(ASK_QUESTION_MAX_LENGTH).optional(),
    raw: z.string().optional(),
    url: z.string().optional(),
    data: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    filename: z.string().optional(),
    mediaType: z.string().optional(),
  })
  .refine(
    (part) =>
      [part.text, part.raw, part.url, part.data].filter((value) => value !== undefined).length ===
      1,
    { message: 'A part must contain exactly one of text, raw, url or data' },
  );

export const messageSchema = z.object({
  messageId: z.string().min(1).max(ID_MAX_LENGTH),
  contextId: z.string().max(ASK_TOKEN_MAX_LENGTH).optional(),
  taskId: z.string().max(ID_MAX_LENGTH).optional(),
  role: z.literal(A2aRole.User),
  parts: z.array(partSchema).min(1).max(PARTS_MAX),
  metadata: z.record(z.string(), z.unknown()).optional(),
  extensions: z.array(z.string()).optional(),
  referenceTaskIds: z.array(z.string()).optional(),
});
export type IncomingMessage = z.infer<typeof messageSchema>;

const historyLengthSchema = z.number().int().min(0).optional();

export const sendMessageParamsSchema = z.object({
  tenant: z.string().optional(),
  message: messageSchema,
  configuration: z
    .object({
      acceptedOutputModes: z.array(z.string()).optional(),
      historyLength: historyLengthSchema,
      returnImmediately: z.boolean().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type SendMessageParams = z.infer<typeof sendMessageParamsSchema>;

export const getTaskParamsSchema = z.object({
  tenant: z.string().optional(),
  id: z.string().min(1).max(ID_MAX_LENGTH),
  historyLength: historyLengthSchema,
});
export type GetTaskParams = z.infer<typeof getTaskParamsSchema>;

export const listTasksParamsSchema = z.object({
  tenant: z.string().optional(),
  contextId: z.string().max(ASK_TOKEN_MAX_LENGTH).optional(),
  status: z.enum(A2aTaskState).optional(),
  pageSize: z.number().int().min(1).max(A2A_MAX_PAGE_SIZE).optional(),
  pageToken: z.string().max(ID_MAX_LENGTH).optional(),
  historyLength: historyLengthSchema,
  includeArtifacts: z.boolean().optional(),
});
export type ListTasksParams = z.infer<typeof listTasksParamsSchema>;

export const cancelTaskParamsSchema = z.object({
  tenant: z.string().optional(),
  id: z.string().min(1).max(ID_MAX_LENGTH),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Crossmart's escalation request, sent as a data part (see the `escalate_to_human` skill). */
export const escalateDataSchema = z.object({
  action: z.literal(A2A_ESCALATE_ACTION),
  contactEmail: z.email().optional(),
  callbackUrl: z.url().max(ASK_CALLBACK_URL_MAX_LENGTH).optional(),
  reason: z.enum(AskEscalationReason).optional(),
});
export type EscalateData = z.infer<typeof escalateDataSchema>;
