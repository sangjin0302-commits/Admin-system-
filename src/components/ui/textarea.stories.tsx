import type { Meta, StoryObj } from "@storybook/react";

import { Textarea } from "./textarea";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "상담 내용을 입력해 주세요", rows: 4 }
};

export const Filled: Story = {
  args: {
    rows: 4,
    defaultValue:
      "외국인 배우자 비자(F-6) 연장을 준비 중입니다. 필요한 서류와 절차를 안내받고 싶습니다."
  }
};
