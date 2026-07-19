import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { getModel, getOpenAIClient } from "@/lib/ai/client";
import { ActionItemSchema, ModelActionDraftSchema, type InterpretRequest } from "@/lib/schemas";
import { applyDefaultDueTime } from "@/lib/time/default-due-time";

const INSTRUCTIONS = `Extract one action draft from the instruction.
Rules:
- Never invent an organisation, amount, consequence, date, or time.
- If no date is stated, dueAt must be null.
- Resolve relative dates only from the supplied current datetime and IANA timezone.
- If a date is stated without a time, default to 07:00 in the supplied timezone. This product default is not an ambiguity and must not require human review.
- Preserve midnight only when the user explicitly says midnight, 00:00, or 12 a.m.
- Return ISO 8601 with an explicit offset when date and time are supported.
- If a date or time is ambiguous or incomplete, set requiresHumanReview true and explain why.
- "Friday evening" is ambiguous because no exact time is stated.
- Keep the action concise and renderable as plain text.`;

export async function interpretAction(input: InterpretRequest) {
  const model = getModel();
  const response = await getOpenAIClient().responses.parse({
    model,
    instructions: INSTRUCTIONS,
    input: JSON.stringify(input),
    text: { format: zodTextFormat(ModelActionDraftSchema, "action_draft") }
  });
  const draft = ModelActionDraftSchema.parse(response.output_parsed);
  const dueAt = applyDefaultDueTime(draft.dueAt, input.instruction);
  const now = new Date().toISOString();
  return ActionItemSchema.parse({
    ...draft,
    dueAt,
    id: crypto.randomUUID(),
    version: 1,
    status: "draft",
    sourceText: input.instruction,
    provenance: {
      model,
      pipelineVersion: "stage-1-v1",
      analyzedAt: now,
      timezone: input.timeContext.timezone,
      locale: input.timeContext.locale
    },
    createdAt: now,
    updatedAt: now
  });
}
