import { z } from "zod";

export const uploadCaseDocumentFileMetaSchema = z.object({
  note: z.string().trim().max(1000).optional()
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
