import { z } from "zod";

export const uploadCaseDocumentFileMetaSchema = z.object({
  note: z.string().trim().max(1000).optional()
});

export const attachCaseDocumentExternalLinkSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  externalUrl: z.string().trim().url().max(2000),
  label: z.string().trim().max(300).optional()
});

export const updateCaseDocumentFileSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("setCurrent")
  }),
  z.object({
    mode: z.literal("updateNote"),
    note: z.string().trim().max(1000).optional()
  })
]);
