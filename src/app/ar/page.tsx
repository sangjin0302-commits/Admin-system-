import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { CHANNELS } from "@/lib/constants/channels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ETHOS — مكتب الإجراءات الإدارية | جين",
  description:
    "إجراءات إدارية كورية للمقيمين الأجانب. تأشيرة، تسجيل أعمال، عقود، طعون إدارية — باللغات العربية والإنجليزية والكورية.",
  alternates: { canonical: "/ar", languages: { ko: "/", en: "/en", ar: "/ar" } },
  openGraph: {
    title: "ETHOS · جين — محامي إداري في سيول يتحدث العربية",
    description: "مراجعة أولية مجانية · استشارة مدفوعة تُخصم عند التوكيل"
  }
};

const PRACTICE = [
  { no: "٠١", title: "التأشيرة / الهجرة", desc: "تغيير وضع الإقامة، تأشيرات الأعمال والاستثمار، الدفاع ضد الترحيل." },
  { no: "٠٢", title: "الطعن الإداري", desc: "من إشعار القرار حتى الجلسة والحكم — مع الالتزام الصارم بمهلة الـ ٩٠ يوماً." },
  { no: "٠٣", title: "العقود / تقصي الحقائق", desc: "مراجعة وصياغة العقود ثنائية اللغة، تقصي الحقائق في النزاعات، تقارير التحقيق." },
  { no: "٠٤", title: "التراخيص والتصاريح", desc: "تصاريح الأعمال والبناء والغذاء والطب، والمتطلبات التكميلية عند الرفض." },
  { no: "٠٥", title: "تأسيس الشركات", desc: "شركة مساهمة أم مؤسسة فردية — اختيار يناسب وضع المؤسس الأجنبي." }
] as const;

const STRUCTURE = [
  { tag: "مجاناً", title: "المراجعة", desc: "فحص الجدوى، نطاق الرسوم، إجابة على سؤالين رئيسيين", color: "bg-emerald-100 text-emerald-800" },
  { tag: "مدفوع", title: "الاستشارة", desc: "استراتيجية، تصميم الوثائق، تحليل المخاطر · ₩٣٣٬٠٠٠–₩٥٥٬٠٠٠", color: "bg-gold-soft text-gold-deep" },
  { tag: "عند التوكيل", title: "التوكيل", desc: "تُخصم رسوم الاستشارة بالكامل من رسوم التوكيل", color: "bg-primary text-white" }
] as const;

const AUTHORITY = [
  { kicker: "السفارة", title: "أكثر من ٢٫٥ سنوات في قسم التأشيرات", sub: "في قسم قنصلي بسفارة في سيول" },
  { kicker: "وزارة العدل", title: "مترجم رسمي — أحكام اللاجئين", sub: "كوري ↔ إنجليزي / عربي" },
  { kicker: "إدارة المحاكم", title: "مترجم محكمة مسجّل", sub: "كوري · إنجليزي · عربي" },
  { kicker: "أكاديمي", title: "كلية الترجمة العليا — جامعة هانكوك", sub: "كوري–عربي · GPA ٤٫٤١" },
  { kicker: "محاضرات", title: "OASIS 4 — برنامج المؤسسين الأجانب", sub: "محاضرات دورية (KISED)" },
  { kicker: "AI", title: "نظام أتمتة قانوني", sub: "تطوير وتشغيل ذاتي" }
] as const;

export default function ArabicLanding() {
  return (
    <div dir="rtl" lang="ar" className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft/20 px-4 py-1.5 text-xs font-bold text-gold-deep">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  محامي إداري · سيول، كوريا
                </span>
              </Reveal>
              <Reveal delay={1}>
                <h1 className="ethos-display mt-7 text-[2.6rem] leading-[1.2] sm:text-5xl">
                  الإجراءات الإدارية الكورية،<br />
                  <span className="ethos-underline-gold">بلغتك.</span>
                </h1>
              </Reveal>
              <Reveal delay={2}>
                <p className="mt-7 max-w-xl text-base leading-9 text-text">
                  تأشيرة، تسجيل أعمال، عقود، طعون إدارية — على يد محامي عمل فعلياً في قسم التأشيرات داخل سفارة بسيول.
                  متاح بالعربية والإنجليزية والكورية.
                </p>
              </Reveal>
              <Reveal delay={3}>
                <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
                  <a href={CHANNELS.telegram.url} target="_blank" rel="noreferrer"
                     className="inline-flex h-12 items-center rounded-lg bg-[#0088CC] px-7 text-sm font-bold text-white shadow-sm transition hover:brightness-95">
                    تيليجرام (الأسرع)
                  </a>
                  <a href={CHANNELS.email.url}
                     className="inline-flex h-12 items-center rounded-lg bg-primary px-7 text-sm font-bold text-white shadow-sm transition hover:bg-text-strong">
                    البريد الإلكتروني
                  </a>
                  <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer"
                     className="inline-flex h-12 items-center rounded-lg border border-gold/40 px-7 text-sm font-semibold text-primary transition hover:bg-gold-soft/30">
                    Naver Talk
                  </a>
                </div>
              </Reveal>
              <Reveal delay={4}>
                <p className="mt-5 text-xs text-text-muted">
                  مراجعة مجانية · استشارة ₩٣٣٬٠٠٠–₩٥٥٬٠٠٠ · تُخصم عند التوكيل
                </p>
              </Reveal>
            </div>

            {/* البطاقة العلامة */}
            <Reveal delay={2} className="flex justify-center lg:justify-start">
              <div className="relative w-full max-w-sm">
                <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gold/10 blur-3xl" aria-hidden />
                <div className="ethos-grain relative flex flex-col items-center rounded-[24px] border border-gold/30 ethos-dark-card-v px-8 py-12 text-center shadow-floating">
                  <p className="font-serif text-[10px] font-bold uppercase tracking-[0.3em] text-gold-soft">ETHOS</p>
                  <h2 className="ethos-display mt-5 text-3xl tracking-[0.28em] text-white">JEAN</h2>
                  <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <p className="ethos-quote text-sm leading-9 text-gold-soft">
                    العقل في الإجراء،<br />
                    التعاطف مع الناس،<br />
                    الثقة في كل خطوة.
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-1.5">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/90">🇸🇦 العربية</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/90">🇬🇧 English</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/90">🇰🇷 한국어</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STRUCTURE */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">كيف تعمل الاستشارة</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">مراجعة مجانية. استشارة مدفوعة. تُخصم عند التوكيل.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {STRUCTURE.map((s, i) => (
              <Reveal key={s.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="ethos-card ethos-card-hover p-7 text-right">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${s.color}`}>{s.tag}</span>
                  <h3 className="ethos-display mt-4 text-xl">{s.title}</h3>
                  <p className="mt-3 text-sm leading-9 text-text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRACTICE */}
      <section className="ethos-band ethos-band-soft py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">مجالات الممارسة</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">خمسة مجالات رئيسية</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {PRACTICE.map((p, i) => (
              <Reveal key={p.no} delay={((i % 2) + 1) as 1 | 2}>
                <div className="ethos-card ethos-card-hover ethos-card-topline relative p-7 text-right">
                  <span className="ethos-index absolute -left-2 -top-4 select-none">{p.no}</span>
                  <h3 className="ethos-display text-xl">{p.title}</h3>
                  <p className="mt-3 text-sm leading-9 text-text-muted">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AUTHORITY */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">لماذا جين</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">سلطة يمكن التحقق منها</h2>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUTHORITY.map((a) => (
              <div key={a.title} className="rounded-2xl border border-gold/30 bg-surface p-5 text-right transition hover:border-gold/60 hover:bg-gold-soft/15">
                <p className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold-deep">{a.kicker}</p>
                <p className="mt-1.5 font-serif text-sm font-bold text-text-strong">{a.title}</p>
                <p className="mt-1 text-xs text-text-muted">{a.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[24px] border border-gold/30 ethos-dark-card p-10 text-center shadow-floating sm:p-14">
              <p className="ethos-eyebrow text-gold-soft">ابدأ الآن</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">أرسل وضعك في سطر واحد.</h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-9 text-white/80">
                أي قناة تعمل — تيليجرام، البريد الإلكتروني، Naver Talk، أو Kakao. مراجعة أولية مجانية خلال ٢٤ ساعة عمل.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/links" className="inline-flex h-12 items-center rounded-lg bg-gold px-7 text-sm font-bold text-primary transition hover:bg-gold-soft">
                  جميع القنوات ←
                </Link>
                <Link href="/intake" className="inline-flex h-12 items-center rounded-lg border border-gold/60 px-7 text-sm font-semibold text-gold-soft transition hover:bg-gold/10">
                  نموذج الويب
                </Link>
              </div>
              <p className="mt-7 text-[11px] text-white/55">
                <Link href="/" className="underline">한국어</Link> · <Link href="/en" className="underline">English</Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
