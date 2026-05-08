ALTER TABLE "Inquiry" ADD COLUMN "intakeChannel" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakePracticeArea" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeContentId" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakePackageId" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeCampaignId" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeUtmSource" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeUtmMedium" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeUtmCampaign" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeUtmContent" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeRef" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeLandingUrl" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "intakeTrackingCapturedAt" TIMESTAMP(3);

CREATE INDEX "Inquiry_intakeSource_idx" ON "Inquiry"("intakeSource");
CREATE INDEX "Inquiry_intakeChannel_idx" ON "Inquiry"("intakeChannel");
CREATE INDEX "Inquiry_intakePracticeArea_idx" ON "Inquiry"("intakePracticeArea");
CREATE INDEX "Inquiry_intakeContentId_idx" ON "Inquiry"("intakeContentId");
