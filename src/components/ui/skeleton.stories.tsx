import type { Meta, StoryObj } from "@storybook/react";

import { ChartSkeleton, Skeleton, StatSkeleton, TableSkeleton } from "./skeleton";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: { layout: "padded" }
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  render: () => <Skeleton className="h-4 w-48" />
};

export const Stat: Story = {
  render: () => <StatSkeleton />
};

export const Table: Story = {
  render: () => <TableSkeleton rows={4} />
};

export const Chart: Story = {
  render: () => <ChartSkeleton />
};
