import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "이름을 입력하세요" }
};

export const WithValue: Story = {
  args: { defaultValue: "김민수" }
};

export const Disabled: Story = {
  args: { placeholder: "이름을 입력하세요", disabled: true }
};
