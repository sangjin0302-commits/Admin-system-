-- Add CaseMatterCategory enum and category field to CaseMatter
-- Categories: VISA_STAY(비자/체류) | ADMIN_APPEAL(행정심판) | CONTRACT_INVESTIGATION(계약서/사실조사) | LICENSE_PERMIT(인허가) | OTHER

ALTER TABLE "CaseMatter" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OTHER';

CREATE INDEX "CaseMatter_category_idx" ON "CaseMatter"("category");
