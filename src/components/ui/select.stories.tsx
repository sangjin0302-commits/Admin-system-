import type { Meta, StoryObj } from "@storybook/react";

import { Select } from "./select";

const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="비자·체류">
      <option value="비자·체류">비자·체류</option>
      <option value="행정심판">행정심판</option>
      <option value="인허가">인허가</option>
      <option value="법인">법인</option>
      <option value="계약">계약</option>
    </Select>
  )
};
