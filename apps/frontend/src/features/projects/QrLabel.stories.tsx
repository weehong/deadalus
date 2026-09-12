import type { Meta, StoryObj } from "@storybook/react-vite";
import { QrLabel } from "@/features/projects/QrLabel";

const meta = {
	title: "Projects/QrLabel",
	component: QrLabel,
	parameters: { layout: "centered" },
	args: {
		url: "https://console.example.com/field/units/cm5unit01",
		label: "#12-01",
		projectCode: "EG2",
		blockName: "A",
	},
} satisfies Meta<typeof QrLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The widest label the type has to hold: a three-digit Unit on a high Storey. */
export const ThreeDigitUnit: Story = { args: { label: "#12-114" } };

/** A ground Storey, named rather than numbered. */
export const GroundStorey: Story = { args: { label: "#G-05" } };

/** Manual names with spaces: clipped at the label's edge, never wrapped. */
export const ManualNames: Story = {
	args: { label: "#Podium Level-Shop 1", blockName: "Podium Level" },
};
