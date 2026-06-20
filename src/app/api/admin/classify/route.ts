import { classifyInquiry } from "@/lib/services/ai-classification-service";
import { withJsonHandler } from "@/lib/utils/api-handler";

type ClassifyBody = { name?: string; message?: string; title?: string };

export const POST = withJsonHandler<ClassifyBody>(
  async (body) => {
    const { name, message, title } = body;
    return classifyInquiry(name ?? "", message ?? "", title);
  },
  {
    logScope: "admin/classify",
    errorMessage: "분류 실패",
    validate: (body) => (body && body.message ? null : "메시지 필요")
  }
);
