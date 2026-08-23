import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { PageHeading } from "./PageHeading";
import { Table } from "./Table";
import { Tag } from "./Tag";

const Gallery = () => {
	const [open, setOpen] = useState(false);
	return (
		<div className="space-y-8 bg-canvas p-8">
			<PageHeading
				actions={<Button>New storey</Button>}
				context="North Point Site"
				title="Building structure"
			/>
			<div className="flex gap-2">
				<Tag>Draft</Tag>
				<Tag tone="positive">Live</Tag>
				<Tag tone="warning">Scheduled</Tag>
			</div>
			<Table>
				<thead>
					<tr>
						<th>Code</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>01-A</td>
						<td>Live</td>
					</tr>
				</tbody>
			</Table>
			<Button
				onClick={() => {
					setOpen(true);
				}}
			>
				Delete storey
			</Button>
			<ConfirmDialog
				itemName="Ground floor"
				open={open}
				title="Delete storey"
				onClose={() => {
					setOpen(false);
				}}
				onConfirm={() => {
					setOpen(false);
				}}
			/>
		</div>
	);
};
const meta = {
	title: "UI/Blueprint primitives",
	component: Gallery,
} satisfies Meta<typeof Gallery>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllPrimitives: Story = {};
export const PageHeadingStory: Story = {
	name: "Page heading",
	render: () => (
		<PageHeading
			actions={<Button>New storey</Button>}
			context="North Point Site"
			title="Building structure"
		/>
	),
};
export const TagStory: Story = {
	name: "Tag tones",
	render: () => (
		<div className="flex gap-2">
			<Tag>Draft</Tag>
			<Tag tone="positive">Live</Tag>
			<Tag tone="warning">Scheduled</Tag>
		</div>
	),
};
export const TableStory: Story = {
	name: "Table",
	render: () => (
		<Table>
			<thead>
				<tr>
					<th>Code</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>01-A</td>
					<td>Live</td>
				</tr>
			</tbody>
		</Table>
	),
};
export const ConfirmDialogStory: Story = {
	name: "Confirm dialog",
	render: () => (
		<ConfirmDialog
			open
			itemName="Ground floor"
			title="Delete storey"
			onClose={() => undefined}
			onConfirm={() => undefined}
		/>
	),
};
