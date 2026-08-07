export function trackGA4Event(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (
    typeof window === "undefined" ||
    typeof (window as any).gtag !== "function"
  )
    return;
  (window as any).gtag("event", eventName, params);
}

export function trackIntakeSubmit(inquiryType: string) {
  trackGA4Event("generate_lead", {
    event_category: "intake",
    inquiry_type: inquiryType,
  });
}

export function trackPhoneClick(source: string) {
  trackGA4Event("contact_phone", {
    event_category: "cta",
    source,
  });
}

export function trackKakaoClick(source: string) {
  trackGA4Event("contact_kakao", {
    event_category: "cta",
    source,
  });
}

export function trackQuoteRequest() {
  trackGA4Event("request_quote", { event_category: "conversion" });
}

export function trackBookingSubmit(category: string) {
  trackGA4Event("book_consultation", {
    event_category: "conversion",
    category,
  });
}

export function trackQuickCheckComplete(category: string) {
  trackGA4Event("quick_check_complete", {
    event_category: "engagement",
    category,
  });
}

export function trackConsultFormSubmit() {
  trackGA4Event("submit_consult_form", { event_category: "conversion" });
}

export function trackNewsletterSubscribe(alreadyConfirmed: boolean) {
  trackGA4Event("newsletter_subscribe", {
    event_category: "conversion",
    already_confirmed: alreadyConfirmed,
  });
}

export function trackScrollDepth(percent: number) {
  trackGA4Event("scroll_depth", {
    event_category: "engagement",
    percent,
  });
}
