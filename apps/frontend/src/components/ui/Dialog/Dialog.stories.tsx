import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/Button";
import { Dialog } from "./Dialog";

const Example = (): React.ReactElement => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button
				onClick={(): void => {
					setOpen(true);
				}}
			>
				Open confirmation
			</Button>
			<Dialog
				open={open}
				title="Delete Subcontractor?"
				onClose={(): void => {
					setOpen(false);
				}}
			>
				<p className="mb-5">
					Delete Acme Fitout and its 2 Members? This cannot be undone.
				</p>
				<div className="flex justify-end gap-3">
					<Button
						data-autofocus
						variant="secondary"
						onClick={(): void => {
							setOpen(false);
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={(): void => {
							setOpen(false);
						}}
					>
						Delete subcontractor
					</Button>
				</div>
			</Dialog>
		</>
	);
};
const meta = {
	title: "UI/Dialog",
	component: Dialog,
	args: {
		open: false,
		title: "Delete Subcontractor?",
		children: null,
		onClose: (): void => {},
	},
	render: Example,
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
