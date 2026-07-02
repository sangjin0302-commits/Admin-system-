import type { Preview } from "@storybook/react";

// ETHOS 디자인 토큰·타이포·ethos-*·ui-* 유틸 전부 로드 (실제 앱과 동일 렌더)
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "canvas",
      values: [
        { name: "canvas", value: "#f4f6f8" },
        { name: "surface", value: "#ffffff" },
        { name: "navy", value: "#1a3c5f" }
      ]
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
