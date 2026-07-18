import assert from "node:assert/strict";

process.env.ADMIN_SESSION_SECRET = "test-secret-for-admin-session-verification-0123456789";



async function main() {
  const {
    createAdminSessionToken,
    verifyAdminSessionToken,
    isAdminSessionConfigured,
    getAdminSessionMaxAgeSec
  } = await import("./admin-session");

  // 비밀키가 있으면 세션 로그인이 활성이어야 한다.
  assert.equal(isAdminSessionConfigured(), true);

  // 정상 토큰은 발급한 사용자명으로 검증되어야 한다.
  const token = await createAdminSessionToken("jean");
  assert.ok(token, "token should be issued");
  assert.equal(await verifyAdminSessionToken(token!), "jean");

  // 위조·손상 토큰은 거부되어야 한다.
  assert.equal(await verifyAdminSessionToken(undefined), null);
  assert.equal(await verifyAdminSessionToken(""), null);
  assert.equal(await verifyAdminSessionToken("not-a-jwt"), null);
  assert.equal(await verifyAdminSessionToken(token! + "x"), null);

  // 다른 비밀키로 서명된 토큰은 거부되어야 한다(핵심 위조 방어).
  const { SignJWT } = await import("jose");
  const forged = await new SignJWT({ sub: "attacker", role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("ethos-admin")
    .setAudience("ethos-admin")
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("wrong-secret-wrong-secret-wrong-secret"));
  assert.equal(await verifyAdminSessionToken(forged), null);

  // role이 admin이 아니면 거부되어야 한다(권한 상승 방어).
  const wrongRole = await new SignJWT({ sub: "jean", role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("ethos-admin")
    .setAudience("ethos-admin")
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!));
  assert.equal(await verifyAdminSessionToken(wrongRole), null);

  // 만료된 토큰은 거부되어야 한다.
  const expired = await new SignJWT({ sub: "jean", role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setIssuer("ethos-admin")
    .setAudience("ethos-admin")
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!));
  assert.equal(await verifyAdminSessionToken(expired), null);

  // 만료시간은 하한(5분)·상한(7일) 안으로 강제되어야 한다.
  process.env.ADMIN_SESSION_MAX_AGE_SEC = "10";
  assert.equal(getAdminSessionMaxAgeSec(), 5 * 60);
  process.env.ADMIN_SESSION_MAX_AGE_SEC = "99999999";
  assert.equal(getAdminSessionMaxAgeSec(), 7 * 24 * 60 * 60);
  delete process.env.ADMIN_SESSION_MAX_AGE_SEC;
  assert.equal(getAdminSessionMaxAgeSec(), 12 * 60 * 60);

  console.log("admin session tests passed");

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
