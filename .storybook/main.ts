import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import type { StorybookConfig } from "@storybook/react-vite";

const dir = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  staticDirs: ["../public"],
  docs: {
    autodocs: "tag"
  },
  async viteFinal(cfg) {
    cfg.resolve = cfg.resolve || {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias || {}),
      "@": resolve(dir, "../src"),
      "next/link": resolve(dir, "mocks/next-link.tsx"),
      "next/image": resolve(dir, "mocks/next-image.tsx"),
      "next/navigation": resolve(dir, "mocks/next-navigation.ts")
    };
    return cfg;
  }
};

export default config;
