import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	CatalogueItemForm,
	type CatalogueItemFailure,
} from "@/features/projects/CatalogueItemForm";
const meta = {
	title: "Projects/CatalogueItemForm",
	component: CatalogueItemForm,
	args: { onSubmit: async (): Promise<CatalogueItemFailure | void> => {} },
} satisfies Meta<typeof CatalogueItemForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Add: Story = {};
export const Rename: Story = {
	args: {
		catalogueItem: { id: "cabinet", name: "Kitchen cabinet", itemCount: 240 },
		onCancel: (): void => {},
	},
};
export const Busy: Story = { args: { pending: true } };
export const NameTaken: Story = {
	args: {
		onSubmit: (): Promise<CatalogueItemFailure> =>
			Promise.resolve({
				field: "name",
				message:
					"A Catalogue Item with this name already exists in this Project.",
			}),
	},
};
