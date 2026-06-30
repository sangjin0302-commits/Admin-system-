export type ABVariant = "control" | "variant_a" | "variant_b";

export function getABVariant(testName: string): ABVariant {
  if (typeof window === "undefined") return "control";
  const key = `ethos.ab.${testName}`;
  const stored = localStorage.getItem(key);
  if (stored && ["control", "variant_a", "variant_b"].includes(stored)) {
    return stored as ABVariant;
  }
  const rand = Math.random();
  const variant: ABVariant = rand < 0.34 ? "control" : rand < 0.67 ? "variant_a" : "variant_b";
  localStorage.setItem(key, variant);
  return variant;
}

export function trackABEvent(testName: string, variant: ABVariant, action: string) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "ab_test", {
    test_name: testName,
    variant,
    action,
  });
  window.dataLayer?.push({
    event: "ab_test",
    test_name: testName,
    variant,
    action,
  });
}
