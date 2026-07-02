import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "./card";

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    muted: { control: "boolean" },
    compact: { control: "boolean" }
  }
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleContent = () => (
  <div className="p-6">
    <h3 className="text-lg font-semibold text-text-strong">문의 요약</h3>
    <p className="mt-2 text-sm text-text-muted">
      외국인 비자 연장 관련 상담 요청이 접수되었습니다. 담당 행정사가 24시간 이내에 회신드립니다.
    </p>
  </div>
);

export const Default: Story = {
  render: () => (
    <Card>
      <SampleContent />
    </Card>
  )
};

export const Muted: Story = {
  render: () => (
    <Card muted>
      <SampleContent />
    </Card>
  )
};

export const Compact: Story = {
  render: () => (
    <Card compact>
      <SampleContent />
    </Card>
  )
};

export const Gallery: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <SampleContent />
      </Card>
      <Card muted>
        <SampleContent />
      </Card>
      <Card compact>
        <SampleContent />
      </Card>
    </div>
  )
};
