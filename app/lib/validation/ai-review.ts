import { z } from 'zod';

export const requestAssessmentSchema = z.object({
  caseId: z.string().uuid(),
  // Optional: which AI employee. If omitted, the action picks the sole active
  // one (the common case with a single AI colleague).
  aiProfileId: z.string().uuid().optional(),
});
export type RequestAssessmentInput = z.infer<typeof requestAssessmentSchema>;

export const reviewProposalSchema = z.object({
  proposalId: z.string().uuid(),
  note: z.string().trim().max(2000).optional(),
});
export type ReviewProposalInput = z.infer<typeof reviewProposalSchema>;

export const answerQuestionSchema = z.object({
  proposalId: z.string().uuid(),
  answer: z.string().trim().min(1, 'Enter an answer.').max(2000),
});
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;
