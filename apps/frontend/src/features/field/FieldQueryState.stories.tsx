import { withRouter } from "@/testing/withRouter";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ApiRequestError } from "@/common/api";
import { FieldBackLink } from "@/features/field/FieldBackLink";
import { FieldQueryState } from "@/features/field/FieldQueryState";

const meta = {
	title: "Field/FieldQueryState",
	component: FieldQueryState<string>,
	decorators: [(Story): React.ReactElement => withRouter(<Story />)],
	parameters: {
		layout: "padded",
		viewport: { defaultViewport: "mobile1" },
	},
	args: {
		query: { isPending: true },
		loading: "Loading Unit…",
		error: "The Unit could not be loaded.",
		retry: "Retry",
		notFound: {
			message:
				"This Unit is not in your work. It may have been reassigned, or the link is out of date.",
			back: (
				<FieldBackLink label="Back to Projects" target={{ to: "projects" }} />
			),
		},
		children: (data: string): React.ReactElement => <p>{data}</p>,
	},
} satisfies Meta<typeof FieldQueryState<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const Failed: Story = {
	args: {
		query: {
			isPending: false,
			isError: true,
			error: new Error("Boom"),
			isFetching: false,
			refetch: (): void => {},
		},
	},
};

/** The API answered 404: the Subcontractor holds nothing here. */
export const NotFound: Story = {
	args: {
		query: {
			isPending: false,
			isError: true,
			error: new ApiRequestError(404, "Not found", "NOT_FOUND"),
			isFetching: false,
			refetch: (): void => {},
		},
	},
};

export const Ready: Story = {
	args: { query: { isPending: false, isError: false, data: "Unit 01" } },
};
