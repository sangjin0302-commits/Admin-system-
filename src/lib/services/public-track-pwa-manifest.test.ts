import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import manifest from "@/app/manifest";

const root = process.cwd();
const pwaManifest = manifest();

assert.equal(pwaManifest.name, "에토스 행정사사무소(ETHOS)");
assert.equal(pwaManifest.short_name, "ETHOS");
assert.equal(pwaManifest.start_url, "/");
assert.equal(pwaManifest.scope, "/");
assert.equal(pwaManifest.display, "standalone");
assert.equal(pwaManifest.lang, "ko-KR");
assert.equal(pwaManifest.background_color, "#faf6ef");
assert.equal(pwaManifest.theme_color, "#1a3c5f");
// 진행상황 조회는 이제 글로벌 앱 shortcut 으로 제공.
assert.ok((pwaManifest.shortcuts ?? []).some((s) => s.url === "/track"));

const icons = pwaManifest.icons ?? [];
assert.equal(
  icons.some((icon) => icon.src === "/icons/logo-192.png" && icon.sizes === "192x192"),
  true
);
assert.equal(
  icons.some((icon) => icon.src === "/icons/logo-512.png" && icon.sizes === "512x512"),
  true
);
assert.equal(
  icons.some((icon) => icon.src === "/icons/logo-512.png" && icon.purpose === "maskable"),
  true
);

// 매니페스트가 참조하는 아이콘 파일이 실제로 존재해야 한다(과거 tracking-*.svg 는 미존재=깨진 참조였음).
for (const iconPath of ["public/icons/logo-192.png", "public/icons/logo-512.png"]) {
  assert.equal(existsSync(join(root, iconPath)), true, `${iconPath} should exist`);
}

const rootLayoutSource = readFileSync(join(root, "src/app/root-layout-safe.tsx"), "utf8");
assert.match(rootLayoutSource, /manifest: "\/manifest\.json"/);
assert.match(rootLayoutSource, /appleWebApp/);
assert.match(rootLayoutSource, /apple-mobile-web-app-capable/);
assert.match(rootLayoutSource, /theme-color/);
assert.match(rootLayoutSource, /logo-192\.png/);

const trackClientSource = readFileSync(
  join(root, "src/components/public-track/public-track-client.tsx"),
  "utf8"
);
assert.match(trackClientSource, /HOME_SCREEN_TITLE/);
assert.match(trackClientSource, /IOS_HOME_SCREEN_GUIDE/);
assert.match(trackClientSource, /ANDROID_HOME_SCREEN_GUIDE/);
assert.equal(trackClientSource.includes("serviceWorker"), false);
assert.equal(trackClientSource.includes("PushManager"), false);
assert.equal(trackClientSource.includes("Notification"), false);
assert.equal(trackClientSource.includes("background sync"), false);
assert.equal(trackClientSource.includes("run-lawbot-workflow"), false);
assert.equal(trackClientSource.includes("client-message-service"), false);

const renderedSource = `${rootLayoutSource}\n${trackClientSource}`;
for (const forbidden of [
  "inquiryId",
  "caseId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "approvalGate",
  "documentDrafts",
  "messageDrafts",
  "communicationLogs",
  "adminNote"
]) {
  assert.equal(renderedSource.includes(forbidden), false);
}

console.log("public track PWA manifest tests passed");
