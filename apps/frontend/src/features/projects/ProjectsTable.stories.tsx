import { withRouter } from "@/testing/withRouter";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProjectsTable } from "@/features/projects/ProjectsTable";
const meta = {
	title: "Projects/ProjectsTable",
	component: ProjectsTable,
	decorators: [(Story): React.ReactElement => withRouter(<Story />)],
	args: {
		data: [
			{
				id: "eg2",
				code: "EG2",
				name: "Evergreen Gardens",
				blockCount: 2,
				storeyCount: 4,
				unitCount: 8,
			},
			{
				id: "klw",
				code: "KLW",
				name: "Kings Lane",
				blockCount: 0,
				storeyCount: 0,
				unitCount: 0,
			},
		],
		meta: { page: 1, pageSize: 20, total: 21 },
		onPageChange: (): void => {},
	},
} satisfies Meta<typeof ProjectsTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LastPage: Story = {
	args: { meta: { page: 2, pageSize: 20, total: 22 } },
};
