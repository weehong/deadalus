import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "@/testing/withRouter";
import { DirectoryTable } from "./DirectoryTable";

const meta = {
	title: "Subcontractors/DirectoryTable",
	component: DirectoryTable,
	decorators: [(Story): React.ReactElement => withRouter(<Story />)],
	args: {
		data: [
			{
				id: "acme",
				name: "Acme Fitout",
				memberCount: 2,
				phones: ["+6591234567", "+6592345678"],
			},
			{
				id: "beacon",
				name: "Beacon Joinery",
				memberCount: 1,
				phones: ["+6593456789"],
			},
		],
		meta: { page: 1, pageSize: 20, total: 21 },
		onPageChange: (): void => {},
	},
} satisfies Meta<typeof DirectoryTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LastPage: Story = {
	args: { meta: { page: 2, pageSize: 20, total: 22 } },
};
