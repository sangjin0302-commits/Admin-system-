import type { Meta, StoryObj } from "@storybook/react";

import { DeadlineReminderBand } from "./deadline-reminder-band";

const meta = {
  title: "Marketing/DeadlineReminderBand",
  component: DeadlineReminderBand,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "select", options: ["soft", "dark"] }
  }
} satisfies Meta<typeof DeadlineReminderBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Soft: Story = { args: { variant: "soft" } };
export const Dark: Story = { args: { variant: "dark" } };
