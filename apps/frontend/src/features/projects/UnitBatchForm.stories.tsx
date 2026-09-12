import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitBatchForm } from "@/features/projects/UnitBatchForm";
const meta = {
	title: "Projects/UnitBatchForm",
	component: UnitBatchForm,
	args: {
		selectedStoreyId: "s1",
		storeys: [
			{ id: "s1", name: "01", position: 0, units: [] },
			{ id: "s2", name: "02", position: 1, units: [] },
		],
		unitTypes: [{ id: "t", code: "AS1", description: "Study", unitCount: 0 }],
		onSubmit: (): void => undefined,
		onCancel: (): void => undefined,
	},
} satisfies Meta<typeof UnitBatchForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Busy: Story = { args: { pending: true } };
export const ServerFailure: Story = {
	args: { error: "Names already exist: 01" },
};
