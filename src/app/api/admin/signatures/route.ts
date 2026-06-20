import { createSignatureRequest } from "@/lib/services/e-signature-service";
import { withJsonHandler } from "@/lib/utils/api-handler";

type SignatureBody = {
  documentTitle?: string;
  signerName?: string;
  signerEmail?: string;
};

export const POST = withJsonHandler<SignatureBody>(
  async (body) => {
    return createSignatureRequest({
      documentTitle: body.documentTitle!,
      signerName: body.signerName!,
      signerEmail: body.signerEmail!
    });
  },
  {
    logScope: "admin/signatures",
    errorMessage: "서버 오류",
    validate: (body) =>
      body && body.documentTitle && body.signerName && body.signerEmail
        ? null
        : "필수 항목 누락"
  }
);
