import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitMatrixAccordion } from "@/features/projects/UnitMatrixAccordion";
const meta = {
	title: "Projects/UnitMatrixAccordion",
	component: UnitMatrixAccordion,
	args: {
		blocks: [
			{
				name: "West",
				stacks: ["01", "02"],
				storeys: [{ name: "01", cells: ["A1", "A2"] }],
				unitCount: 2,
				warnings: [
					{
						code: "EMPTY_STOREY",
						label: "B1",
						message: "Server fallback text",
					},
				],
			},
			{
				name: "East",
				stacks: ["03", "04"],
				storeys: [{ name: "01", cells: ["PH", null] }],
				unitCount: 1,
				warnings: [],
			},
		],
	},
} satisfies Meta<typeof UnitMatrixAccordion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const CommitHeaders: Story = {
	args: {
		selections: [
			{ name: "West", included: true },
			{ name: "East", included: false },
		],
		onSelectionChange: (): void => {},
	},
};
export const DuplicateNames: Story = {
	args: {
		selections: [
			{ name: "West", included: true },
			{ name: " west ", included: true },
		],
		errors: ["duplicate", "duplicate"],
		onSelectionChange: (): void => {},
	},
};
