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
  pipelineVersion: z.enum(["stage-1-v1", "stage-2-v1"]),
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
  source: z
    .object({
      kind: z.enum(["typed_text", "pdf"]),
      displayName: z.string().max(255).nullable(),
      sourceHash: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .nullable(),
      retained: z.literal(false),
      extractedExcerptSaved: z.boolean()
    })
    .optional(),
  proofLink: z
    .object({
      allRequiredClaimsVerified: z.boolean(),
      blockedClaims: z.array(z.string()),
      evidenceQuotes: z.array(z.string().max(2000))
    })
    .optional(),
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

export const SourcePageSchema = z.object({
  pageNumber: z.number().int().min(1).max(5),
  text: z.string().max(50_000)
});
export const DocumentClaimKindSchema = z.enum([
  "required_action",
  "deadline",
  "consequence",
  "completion_criterion"
]);
export const ModelDocumentProposalSchema = z.object({
  documentType: z.string().min(1).max(100),
  explanation: z.string().min(1).max(1000),
  requiredAction: z.string().min(1).max(500).nullable(),
  deadline: DueDateSchema,
  consequence: z.string().min(1).max(500).nullable(),
  completionCriteria: z.array(z.string().min(1).max(300)).max(10),
  uncertainty: z.object({
    requiresHumanReview: z.boolean(),
    conflicts: z.array(z.string().min(1).max(300)).max(10),
    clarificationQuestion: z.string().min(1).max(300).nullable()
  }),
  claims: z
    .array(
      z.object({
        kind: DocumentClaimKindSchema,
        value: z.string().min(1).max(500),
        quote: z.string().min(1).max(2000)
      })
    )
    .max(25)
});
export const AnalyzeDocumentRequestSchema = z
  .object({
    displayName: z.string().min(1).max(255),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    pages: z.array(SourcePageSchema).min(1).max(5),
    timeContext: TimeContextSchema
  })
  .superRefine((value, context) => {
    const characters = value.pages.reduce((total, page) => total + page.text.length, 0);
    if (characters > 50_000)
      context.addIssue({ code: "custom", message: "Extracted text exceeds 50,000 characters" });
  });
export const EvidenceMatchSchema = z.object({
  kind: DocumentClaimKindSchema,
  value: z.string(),
  quote: z.string(),
  normalizedQuote: z.string(),
  page: z.number().int().min(1).max(5).nullable(),
  charStart: z.number().int().min(0).nullable(),
  charEnd: z.number().int().min(0).nullable(),
  verificationStatus: z.enum(["verified", "near_match_review", "unsupported"]),
  verificationReason: z.string()
});
export const DocumentAnalysisResultSchema = z.object({
  documentType: z.string(),
  explanation: z.string(),
  requiredAction: z.string().nullable(),
  deadline: DueDateSchema,
  consequence: z.string().nullable(),
  completionCriteria: z.array(z.string()),
  evidence: z.array(EvidenceMatchSchema),
  blockedClaims: z.array(z.string()),
  conflicts: z.array(z.string()),
  clarificationQuestion: z.string().nullable(),
  requiresHumanReview: z.boolean(),
  allRequiredClaimsVerified: z.boolean(),
  canConfirm: z.boolean(),
  source: z.object({
    displayName: z.string(),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    pages: z.array(SourcePageSchema).min(1).max(5),
    retained: z.literal(false)
  }),
  provenance: z.object({
    model: z.string(),
    pipelineVersion: z.literal("stage-2-v1"),
    analyzedAt: z.string().datetime()
  })
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type ModelActionDraft = z.infer<typeof ModelActionDraftSchema>;
export type InterpretRequest = z.infer<typeof InterpretRequestSchema>;
export type SourcePage = z.infer<typeof SourcePageSchema>;
export type ModelDocumentProposal = z.infer<typeof ModelDocumentProposalSchema>;
export type AnalyzeDocumentRequest = z.infer<typeof AnalyzeDocumentRequestSchema>;
export type DocumentAnalysisResult = z.infer<typeof DocumentAnalysisResultSchema>;
