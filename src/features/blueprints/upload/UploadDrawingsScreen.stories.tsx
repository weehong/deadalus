import type { Meta, StoryObj } from "@storybook/react-vite";
import { UploadDrawingsScreen } from "./UploadDrawingsScreen";
const meta = {
	title: "Blueprints/Upload drawings",
	component: UploadDrawingsScreen,
	args: { siteName: "North Point Site" },
} satisfies Meta<typeof UploadDrawingsScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
