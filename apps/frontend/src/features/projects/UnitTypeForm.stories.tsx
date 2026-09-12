import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	UnitTypeForm,
	type UnitTypeFailure,
} from "@/features/projects/UnitTypeForm";
const meta = {
	title: "Projects/UnitTypeForm",
	component: UnitTypeForm,
	args: { onSubmit: async (): Promise<UnitTypeFailure | void> => {} },
} satisfies Meta<typeof UnitTypeForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Add: Story = {};
export const Edit: Story = {
	args: {
		unitType: {
			id: "t1",
			code: "BP2(p) (M)",
			description: "2 Bedroom Premium",
			unitCount: 12,
		},
		onCancel: (): void => {},
	},
};
export const Busy: Story = { args: { pending: true } };
export const CodeTaken: Story = {
	args: {
		onSubmit: (): Promise<UnitTypeFailure> =>
			Promise.resolve({
				field: "code",
				message: "A Unit Type with this code already exists.",
			}),
	},
};
