import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "./badge";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "신규" },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "status", "urgency", "language"]
    }
  }
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { tone: "default", children: "기본" } };

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="default">기본</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="status" status="NEW">
          신규
        </Badge>
        <Badge tone="status" status="WON">
          수임
        </Badge>
        <Badge tone="status" status="QUOTE_SENT">
          견적 발송
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="urgency" urgency="LOW">
          낮음
        </Badge>
        <Badge tone="urgency" urgency="HIGH">
          높음
        </Badge>
        <Badge tone="urgency" urgency="CRITICAL">
          매우 긴급
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="language" language="KO">
          한국어
        </Badge>
        <Badge tone="language" language="EN">
          영어
        </Badge>
        <Badge tone="language" language="AR">
          아랍어
        </Badge>
      </div>
    </div>
  )
};
