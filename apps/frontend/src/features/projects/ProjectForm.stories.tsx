import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProjectForm } from "@/features/projects/ProjectForm";
import type { ProjectFailure } from "@/features/projects/formSchemas";

const meta = {
	title: "Projects/ProjectForm",
	component: ProjectForm,
	args: {
		onCancel: (): void => undefined,
		onSubmit: (): Promise<ProjectFailure | void> => Promise.resolve(),
	},
} satisfies Meta<typeof ProjectForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const ServerFailure: Story = {
	args: {
		onSubmit: (): Promise<ProjectFailure> =>
			Promise.resolve({
				message: "Could not create the project. Please try again.",
			}),
	},
};
export const CodeTaken: Story = {
	args: {
		onSubmit: (): Promise<ProjectFailure> =>
			Promise.resolve({
				field: "code",
				message: "A project with this code already exists.",
			}),
	},
};
export const Edit: Story = {
	args: {
		mode: "edit",
		initialValues: { name: "Emerald Gardens", code: "EG2" },
	},
};
export const Saving: Story = { args: { ...Edit.args, pending: true } };
