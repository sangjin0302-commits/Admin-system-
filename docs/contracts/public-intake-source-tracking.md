# Public Intake Source Tracking

## Scope

`/intake` may receive optional campaign/source query parameters from Auto-Sns or Marketing Analyze CTA links. These values are stored with the inquiry for admin attribution only.

## Accepted Query Parameters

- `source`
- `channel`
- `practice_area`
- `content_id`
- `package_id`
- `campaign_id`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `ref`

The form submits these values under `intakeTracking`. Missing values never block public intake.

## Sanitization

- Values are trimmed.
- Control characters and CR/LF are removed.
- Parameter values are truncated to 160 characters.
- Landing URL is reconstructed from allowed tracking parameters only and truncated to 2048 characters.
- Values are treated as plain text. No raw HTML rendering.
- Secrets, auth headers, tokens, and arbitrary URL parameters are not captured.

## Storage

Tracking is stored on `Inquiry` as flat nullable fields:

- `intakeSource`
- `intakeChannel`
- `intakePracticeArea`
- `intakeContentId`
- `intakePackageId`
- `intakeCampaignId`
- `intakeUtmSource`
- `intakeUtmMedium`
- `intakeUtmCampaign`
- `intakeUtmContent`
- `intakeRef`
- `intakeLandingUrl`
- `intakeTrackingCapturedAt`

`intakeSource` already defaults to `website`; admin UI treats only default source with no other tracking fields as no campaign tracking.

## Public Response Safety

Public submit response may include the customer tracking code only. It must not return internal IDs, workflow status, Lawbot status, admin logs, or full tracking metadata.

## Admin Display

Admin inquiry detail shows a `접수 유입 정보` section. Missing tracking shows `유입 추적 정보가 없습니다.`. Landing URL links open in a new tab with `rel="noreferrer noopener"`.

## Migration

Production deployment requires applying the included Prisma migration before relying on stored campaign fields.
