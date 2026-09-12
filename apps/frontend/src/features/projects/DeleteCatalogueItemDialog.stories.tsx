import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { DeleteCatalogueItemDialog } from "@/features/projects/DeleteCatalogueItemDialog";
const meta = {
	title: "Projects/DeleteCatalogueItemDialog",
	component: DeleteCatalogueItemDialog,
	args: {
		open: true,
		name: "Kitchen cabinet",
		onCancel: (): void => {},
		onConfirm: (): Promise<void> => Promise.resolve(),
	},
} satisfies Meta<typeof DeleteCatalogueItemDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
/** The dialog renders in a portal, so the play function looks in the whole document. */
const confirm = async ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}): Promise<void> => {
	await userEvent.click(
		await within(canvasElement.ownerDocument.body).findByRole("button", {
			name: "Delete",
		})
	);
};
export const Default: Story = {};
export const Busy: Story = {
	args: { onConfirm: (): Promise<void> => new Promise(() => {}) },
	play: confirm,
};
export const Failed: Story = {
	args: { onConfirm: (): Promise<void> => Promise.reject(new Error()) },
	play: confirm,
};
