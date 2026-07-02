import type { Meta, StoryObj } from "@storybook/react";

import { Field, FieldGroup } from "./field";
import { Input } from "./input";
import { Select } from "./select";

const meta = {
  title: "Primitives/Field",
  component: Field,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "이름", hint: "실명을 입력해 주세요" },
  render: () => (
    <Field label="이름" hint="실명을 입력해 주세요">
      <Input placeholder="이름을 입력하세요" />
    </Field>
  )
};

export const WithFieldGroup: Story = {
  args: { label: "이름" },
  render: () => (
    <FieldGroup>
      <Field label="이름" hint="실명을 입력해 주세요">
        <Input placeholder="이름을 입력하세요" />
      </Field>
      <Field label="상담 분야">
        <Select defaultValue="비자·체류">
          <option value="비자·체류">비자·체류</option>
          <option value="행정심판">행정심판</option>
          <option value="인허가">인허가</option>
          <option value="법인">법인</option>
          <option value="계약">계약</option>
        </Select>
      </Field>
    </FieldGroup>
  )
};
