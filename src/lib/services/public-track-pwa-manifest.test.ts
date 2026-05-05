import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import manifest from "@/app/manifest";

const root = process.cwd();
const pwaManifest = manifest();

assert.equal(pwaManifest.name, "행정사 진행상황 조회");
assert.equal(pwaManifest.short_name, "진행상황");
assert.equal(pwaManifest.start_url, "/track");
assert.equal(pwaManifest.scope, "/");
assert.equal(pwaManifest.display, "standalone");
assert.equal(pwaManifest.lang, "ko-KR");
assert.equal(pwaManifest.background_color, "#ffffff");
assert.equal(pwaManifest.theme_color, "#0f4c81");

const icons = pwaManifest.icons ?? [];
assert.equal(
  icons.some((icon) => icon.src === "/icons/tracking-192.svg" && icon.sizes === "192x192"),
  true
);
assert.equal(
  icons.some((icon) => icon.src === "/icons/tracking-512.svg" && icon.sizes === "512x512"),
  true
);
assert.equal(
  icons.some((icon) => icon.src === "/icons/tracking-maskable.svg" && icon.purpose === "maskable"),
  true
);

for (const iconPath of [
  "public/icons/tracking-192.svg",
  "public/icons/tracking-512.svg",
  "public/icons/tracking-maskable.svg"
]) {
  const absolutePath = join(root, iconPath);
  assert.equal(existsSync(absolutePath), true, `${iconPath} should exist`);
  const source = readFileSync(absolutePath, "utf8");
  assert.match(source, /<svg /);
}

const rootLayoutSource = readFileSync(join(root, "src/app/root-layout-safe.tsx"), "utf8");
assert.match(rootLayoutSource, /manifest: "\/manifest\.webmanifest"/);
assert.match(rootLayoutSource, /appleWebApp/);
assert.match(rootLayoutSource, /apple-mobile-web-app-capable/);
assert.match(rootLayoutSource, /theme-color/);
assert.match(rootLayoutSource, /tracking-192\.svg/);

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
