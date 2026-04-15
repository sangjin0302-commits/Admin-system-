# Google Workspace Setup

이 문서는 `admin-office-mvp`에서 Google Drive 링크 저장과 Google Calendar 일정 연동을 켜는 최소 설정 메모입니다.

## 1. Google Drive 링크 저장

현재 구조는 파일 자체를 서버로 업로드하는 대신, 사건 문서 항목에 `Google Drive 링크`를 저장하는 방식입니다.

동작 방식:
- 관리자 `사건 관리` 화면에서 문서 항목을 선택
- Google Drive 링크를 붙여넣고 저장
- 저장된 링크가 기존 파일 목록처럼 기록됨
- 다운로드 버튼을 누르면 Drive 링크로 이동

장점:
- 별도 S3/R2 비용이 없음
- 고객이 메일이나 메신저로 보낸 Drive 링크를 바로 사건 문서에 연결할 수 있음
- 개인 정리용으로 쓰기 쉬움

주의:
- 앱이 Drive 파일 자체를 업로드하지는 않음
- 접근 권한은 Google Drive 쪽 공유 설정을 따름

## 2. Google Calendar 일정 연동

현재 앱은 사건/후속조치 저장 시 Google Calendar webhook을 호출하는 구조입니다.

연동 생성 대상:
- 사건 일반 일정
- 제출 마감
- 보완 마감
- 체류 만료
- 내부 마감
- 다음 후속 일정
- 개별 후속조치 마감일

앱에 필요한 env:
- `GOOGLE_CALENDAR_SYNC_ENABLED=true`
- `GOOGLE_CALENDAR_WEBHOOK_URL`
- `GOOGLE_CALENDAR_WEBHOOK_TOKEN`
- `ADMIN_APP_URL`

## 3. 추천 방식: Google Apps Script Webhook

혼자 운영하는 경우 가장 가벼운 방식은 Google Apps Script Webhook입니다.

순서:
1. [script.google.com](https://script.google.com)에서 새 Apps Script 생성
2. 아래 예시 코드를 붙여넣기
3. `CALENDAR_ID`와 `WEBHOOK_TOKEN` 설정
4. `Deploy > New deployment > Web app`
5. `Execute as: Me`
6. `Who has access: Anyone`
7. 배포 후 받은 Web app URL을 `GOOGLE_CALENDAR_WEBHOOK_URL`로 사용

예시 Apps Script:

```javascript
const CALENDAR_ID = "primary";
const WEBHOOK_TOKEN = "replace-with-your-secret";

function doPost(e) {
  const request = JSON.parse(e.postData.contents || "{}");
  const token = String(request.token || "").trim();

  if (token !== WEBHOOK_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: "unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    return ContentService.createTextOutput(JSON.stringify({ error: "calendar_not_found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (request.action === "delete") {
    if (request.eventId) {
      const event = calendar.getEventById(request.eventId);
      if (event) {
        event.deleteEvent();
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const start = new Date(request.date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  let event = request.eventId ? calendar.getEventById(request.eventId) : null;
  if (event) {
    event.setTitle(request.title);
    event.setDescription(request.description || "");
    event.setTime(start, end);
  } else {
    event = calendar.createEvent(request.title, start, end, {
      description: request.description || ""
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, eventId: event.getId() }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 4. Vercel env 예시

```text
ADMIN_APP_URL=https://adminofficemvp2.vercel.app
GOOGLE_CALENDAR_SYNC_ENABLED=true
GOOGLE_CALENDAR_WEBHOOK_URL=https://script.google.com/macros/s/your-script-id/exec
GOOGLE_CALENDAR_WEBHOOK_TOKEN=your-strong-random-secret
```

## 5. DB 반영

캘린더 이벤트 ID와 Drive 링크 필드를 저장하려면 DB 스키마 반영이 한 번 필요합니다.

```powershell
cd C:\codex-buildcheck\admin-office-mvp
$env:DATABASE_PROVIDER='postgresql'
$env:DATABASE_URL='<Railway Public/TCP Proxy PostgreSQL URL>'
$env:PGSSL_REJECT_UNAUTHORIZED='false'
npm run prisma:generate:postgres
npx prisma db push --schema .codex-tmp/schema.postgresql.prisma
```

## 6. 텔레그램 일정 브리핑은 어떻게 켜나

필요한 env만 넣으면 됩니다.

```text
TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_CHAT_ID=123456789
TELEGRAM_SCHEDULE_BRIEFING_ENABLED=true
CRON_SECRET=your-strong-random-secret
ADMIN_APP_URL=https://adminofficemvp2.vercel.app
```

그 다음 Vercel redeploy를 하면, `vercel.json`에 등록된 cron이 매일 일정 브리핑 API를 호출합니다.
