import { z } from "zod";

export const ActionStatusSchema = z.enum(["draft", "confirmed", "completed", "discarded"]);
export const DueDateSchema = z.string().datetime({ offset: true }).nullable();
export const UncertaintySchema = z.object({
  requiresHumanReview: z.boolean(),
  reasons: z.array(z.string().min(1).max(240)).max(5),
  clarificationQuestion: z.string().min(1).max(240).nullable()
});
export const ProvenanceSchema = z.object({
  model: z.string().min(1),
  pipelineVersion: z.literal("stage-1-v1"),
  analyzedAt: z.string().datetime({ offset: true }),
  timezone: z.string().min(1),
  locale: z.string().min(2)
});
export const ModelActionDraftSchema = z.object({
  title: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  dueAt: DueDateSchema,
  context: z.string().max(500).nullable(),
  uncertainty: UncertaintySchema
});
export const ActionItemSchema = ModelActionDraftSchema.extend({
  id: z.string().uuid(),
  version: z.literal(1),
  status: ActionStatusSchema,
  sourceText: z.string().min(1).max(2000),
  provenance: ProvenanceSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true })
});
export const TimeContextSchema = z.object({
  currentDatetime: z.string().datetime({ offset: true }),
  timezone: z.string().min(1).max(100),
  locale: z.string().min(2).max(35)
});
export const InterpretRequestSchema = z.object({
  instruction: z.string().trim().min(1).max(2000),
  timeContext: TimeContextSchema
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type ModelActionDraft = z.infer<typeof ModelActionDraftSchema>;
export type InterpretRequest = z.infer<typeof InterpretRequestSchema>;
