import type { Meta, StoryObj } from "@storybook/react";

import { Table, TableContainer } from "./table";

const meta = {
  title: "Primitives/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: { layout: "padded" }
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <th>문의자</th>
            <th>분야</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>김민수</td>
            <td>비자·체류</td>
            <td>신규</td>
          </tr>
          <tr>
            <td>이서연</td>
            <td>행정심판</td>
            <td>견적 발송</td>
          </tr>
          <tr>
            <td>박준호</td>
            <td>인허가</td>
            <td>수임</td>
          </tr>
        </tbody>
      </Table>
    </TableContainer>
  )
};
