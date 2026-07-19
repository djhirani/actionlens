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
  pipelineVersion: z.enum(["stage-1-v1", "stage-2-v1", "stage-3-v1"]),
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
      kind: z.enum(["typed_text", "pdf", "image"]),
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
  completionCriteria: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        description: z.string().min(1).max(300),
        required: z.boolean()
      })
    )
    .max(10)
    .default([]),
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

export const ReadConfidenceSchema = z.enum(["high", "medium", "low"]);
export const ModelImageCardSchema = ModelActionDraftSchema.extend({
  completionCriteria: z.array(z.string().min(1).max(300)).max(10),
  evidenceQuotes: z.array(z.string().min(1).max(2000)).min(1).max(25)
});
export const ModelImageAnalysisSchema = z.object({
  transcription: z.string().min(1).max(50_000),
  readConfidence: ReadConfidenceSchema,
  card: ModelImageCardSchema
});
export const AnalyzeImageRequestSchema = z.object({
  displayName: z.string().min(1).max(255),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  mimeType: z.enum(["image/jpeg", "image/png", "image/heic", "image/webp"]),
  imageDataUrl: z.string().max(14_000_000),
  timeContext: TimeContextSchema
});
export const ImageAnalysisResultSchema = z.object({
  transcription: z.string(),
  readConfidence: ReadConfidenceSchema,
  card: ActionItemSchema.nullable(),
  rejectionReason: z.string().nullable()
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

export const CompletionStatusSchema = z.enum([
  "appears_complete",
  "needs_human_review",
  "not_verified"
]);
export const CompletionEvidencePageSchema = z.object({
  pageNumber: z.number().int().min(1).max(3),
  text: z.string().max(30_000)
});
export const ModelCompletionProposalSchema = z.object({
  proposedStatus: CompletionStatusSchema,
  matchedCriteria: z.array(
    z.object({
      criterionId: z.string().min(1).max(100),
      explanation: z.string().min(1).max(500),
      quote: z.string().min(1).max(2000)
    })
  ),
  missingCriteria: z.array(z.string().min(1).max(100)),
  uncertaintyReasons: z.array(z.string().min(1).max(300)).max(10),
  explanation: z.string().min(1).max(1000),
  disclaimer: z.string().min(1).max(500)
});
export const VerifyCompletionRequestSchema = z
  .object({
    action: ActionItemSchema,
    displayName: z.string().min(1).max(255),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    pages: z.array(CompletionEvidencePageSchema).min(1).max(3),
    timeContext: TimeContextSchema
  })
  .superRefine((value, context) => {
    if (value.action.source?.kind !== "pdf")
      context.addIssue({
        code: "custom",
        message: "Proof of Done requires a document-derived action"
      });
    if (!value.action.completionCriteria.some((criterion) => criterion.required))
      context.addIssue({ code: "custom", message: "At least one required criterion is needed" });
    const characters = value.pages.reduce((total, page) => total + page.text.length, 0);
    if (characters > 30_000)
      context.addIssue({
        code: "custom",
        message: "Completion evidence exceeds 30,000 characters"
      });
  });
export const CompletionEvidenceMatchSchema = z.object({
  criterionId: z.string(),
  explanation: z.string(),
  evidence: EvidenceMatchSchema.omit({ kind: true, value: true })
});
export const CompletionCheckSchema = z.object({
  id: z.string().uuid(),
  actionId: z.string().uuid(),
  status: CompletionStatusSchema,
  matchedCriteria: z.array(CompletionEvidenceMatchSchema),
  missingCriteria: z.array(z.string()),
  uncertaintyReasons: z.array(z.string()),
  explanation: z.string(),
  disclaimer: z.string(),
  source: z.object({
    displayName: z.string(),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    retained: z.literal(false),
    excerptsSaved: z.boolean()
  }),
  userDecision: z.enum(["pending", "mark_complete", "keep_open"]),
  createdAt: z.string().datetime()
});
export const CompletionAnalysisResultSchema = CompletionCheckSchema.extend({
  sourcePages: z.array(CompletionEvidencePageSchema).min(1).max(3)
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type ModelActionDraft = z.infer<typeof ModelActionDraftSchema>;
export type InterpretRequest = z.infer<typeof InterpretRequestSchema>;
export type SourcePage = z.infer<typeof SourcePageSchema>;
export type ModelDocumentProposal = z.infer<typeof ModelDocumentProposalSchema>;
export type AnalyzeDocumentRequest = z.infer<typeof AnalyzeDocumentRequestSchema>;
export type AnalyzeImageRequest = z.infer<typeof AnalyzeImageRequestSchema>;
export type ImageAnalysisResult = z.infer<typeof ImageAnalysisResultSchema>;
export type DocumentAnalysisResult = z.infer<typeof DocumentAnalysisResultSchema>;
export type CompletionCriterion = z.infer<typeof ActionItemSchema>["completionCriteria"][number];
export type ModelCompletionProposal = z.infer<typeof ModelCompletionProposalSchema>;
export type VerifyCompletionRequest = z.infer<typeof VerifyCompletionRequestSchema>;
export type CompletionCheck = z.infer<typeof CompletionCheckSchema>;
export type CompletionAnalysisResult = z.infer<typeof CompletionAnalysisResultSchema>;
