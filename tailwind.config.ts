import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // next/font 는 self-host 폰트를 해시 패밀리명으로 등록하고 CSS 변수로만 노출한다.
        // 리터럴 폰트명("Playfair Display" 등)은 등록 안 돼 폴백(Georgia/시스템)으로 새던
        // 버그 → 변수(--font-*)를 우선 참조하도록 수정. 본문·워드마크·블로그 전문에 영향.
        sans: ["var(--font-body-ko)", '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', "sans-serif"],
        serif: ["var(--font-display-latin)", "var(--font-display-ko)", '"Noto Serif KR"', "Georgia", "serif"]
      },
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-surface-raised) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        "line-strong": "rgb(var(--color-line-strong) / <alpha-value>)",
        "text-strong": "rgb(var(--color-text-strong) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--color-primary-soft) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        "gold-soft": "rgb(var(--color-gold-soft) / <alpha-value>)",
        "gold-deep": "rgb(var(--color-gold-deep) / <alpha-value>)"
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        floating: "var(--shadow-floating)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      }
    }
  },
  plugins: []
};

export default config;
