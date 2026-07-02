import type { Meta, StoryObj } from "@storybook/react";

import { QuickConsultForm } from "./quick-consult-form";

const meta = {
  title: "Marketing/QuickConsultForm",
  component: QuickConsultForm,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof QuickConsultForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
