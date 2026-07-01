import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { getInquiryById } from "@/lib/services/inquiry-service";
import {
  extractKeyIssuesFromSnapshotPayload,
  findSimilarInquiries
} from "@/lib/services/similar-inquiries-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.similar.get");

  try {
    const { id: rawId } = await context.params;
    const id = normalizeAdminEntityId(rawId);
    if (!id) {
      return api.error(400, "문의 ID 형식이 올바르지 않습니다.", {
        code: "INVALID_INQUIRY_ID"
      });
    }

    const inquiry = await getInquiryById(id);
    if (!inquiry) {
      return api.error(404, "문의를 찾을 수 없습니다.", {
        code: "INQUIRY_NOT_FOUND"
      });
    }

    const keyIssues = extractKeyIssuesFromSnapshotPayload(
      inquiry.lawbotSnapshotPayload ?? null
    );

    const similar = await findSimilarInquiries(keyIssues, inquiry.id, 5);

    return api.ok({ ok: true, similar });
  } catch (error) {
    api.logError(error);
    return api.error(500, "유사 사건을 불러오지 못했습니다.", {
      code: "GET_SIMILAR_INQUIRIES_FAILED"
    });
  }
}
