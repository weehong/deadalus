import type { Meta, StoryObj } from "@storybook/react-vite";
import { BlocksPane } from "@/features/projects/BlocksPane";
const meta = {
	title: "Projects/BlocksPane",
	component: BlocksPane,
	args: {
		blocks: [{ id: "a", name: "A", position: 0, storeys: [] }],
		selectedId: "a",
		onSelect: (): void => undefined,
		onAdd: (): Promise<void> => Promise.resolve(),
		onRename: (): Promise<void> => Promise.resolve(),
		onDelete: (): Promise<void> => Promise.resolve(),
	},
} satisfies Meta<typeof BlocksPane>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { blocks: [] } };
