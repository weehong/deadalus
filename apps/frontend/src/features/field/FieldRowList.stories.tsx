import { withRouter } from "@/testing/withRouter";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldRowList } from "@/features/field/FieldRowList";

const meta = {
	title: "Field/FieldRowList",
	component: FieldRowList,
	decorators: [(Story): React.ReactElement => withRouter(<Story />)],
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
	args: {
		label: "Projects",
		rows: [
			{
				id: "aurora",
				code: "AUR",
				name: "Aurora",
				itemCount: 1,
				progression: 0,
				link: { to: "project", id: "aurora" },
			},
			{
				id: "gardens",
				code: "EG2",
				name: "Evergreen Gardens",
				itemCount: 3,
				progression: 73.3,
				link: { to: "project", id: "gardens" },
			},
		],
	},
} satisfies Meta<typeof FieldRowList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Projects where the Subcontractor holds Items. */
export const Projects: Story = {};

/** The Blocks of one Project; each row selects that Block in the search params. */
export const Blocks: Story = {
	args: {
		label: "Blocks",
		rows: [
			{
				id: "a",
				name: "A",
				itemCount: 3,
				progression: 73.3,
				link: { to: "project", id: "gardens", search: { block: "a" } },
			},
			{
				id: "c",
				name: "1 Tampines Street 62 (Tower 3)",
				itemCount: 12,
				progression: 100,
				link: { to: "project", id: "gardens", search: { block: "c" } },
			},
		],
	},
};

/** The Units of one Storey; each row opens the Unit's own screen. */
export const Units: Story = {
	args: {
		label: "Units",
		rows: [
			{
				id: "u1",
				name: "01",
				itemCount: 2,
				progression: 70,
				link: { to: "unit", unitId: "u1" },
			},
			{
				id: "u3",
				name: "03",
				itemCount: 1,
				progression: 40,
				link: { to: "unit", unitId: "u3" },
			},
		],
	},
};
