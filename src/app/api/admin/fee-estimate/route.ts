import { withJsonHandler } from "@/lib/utils/api-handler";
import { estimateFee, type FeeEstimateInput } from "@/lib/services/fee-estimator-service";

export const POST = withJsonHandler<FeeEstimateInput>(
  async (body) => {
    return await estimateFee(body);
  },
  {
    logScope: "admin/fee-estimate",
    errorMessage: "수임료 견적 생성 중 오류가 발생했습니다.",
    validate: (body) => {
      if (!body || typeof body.description !== "string" || body.description.trim().length < 2) {
        return "description은 필수입니다.";
      }
      return null;
    },
  },
);
