import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrandPanel } from "./BrandPanel";

const meta = {
	title: "Auth/BrandPanel",
	component: BrandPanel,
	parameters: { layout: "fullscreen" },
	args: {
		kicker: "Administrator console",
		headline: "Furniture fitout, unit by unit.",
		blurb:
			"Set out projects, blocks, storeys and units. Assign items to subcontractors, then read progression back off the QR labels on site.",
		hierarchy: ["Projects", "Blocks", "Storeys", "Units"],
	},
} satisfies Meta<typeof BrandPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
