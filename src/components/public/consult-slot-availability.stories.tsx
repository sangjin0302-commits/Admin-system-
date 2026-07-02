import type { Meta, StoryObj } from "@storybook/react";

import { ConsultSlotAvailability } from "./consult-slot-availability";

const meta = {
  title: "Marketing/ConsultSlotAvailability",
  component: ConsultSlotAvailability,
  tags: ["autodocs"],
  parameters: { layout: "padded" }
} satisfies Meta<typeof ConsultSlotAvailability>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
