import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	LABELS_PER_SHEET,
	QrLabelSheet,
	QrSheetStyles,
} from "@/features/projects/QrLabelSheet";
import type { QrLabelUnit } from "@/features/projects/qr-labels";

/** A Storey's worth of Units, numbered from 01, as one label each. */
const units = (count: number, storey = "01"): Array<QrLabelUnit> =>
	Array.from({ length: count }, (_, index) => ({
		unitId: `unit-${storey}-${index + 1}`,
		label: `#${storey}-${String(index + 1).padStart(2, "0")}`,
		url: `https://console.example.com/field/units/unit-${storey}-${index + 1}`,
	}));

const meta = {
	title: "Projects/QrLabelSheet",
	component: QrLabelSheet,
	parameters: { layout: "fullscreen" },
	decorators: [
		(Story): React.ReactElement => (
			<>
				<QrSheetStyles />
				<Story />
			</>
		),
	],
	args: {
		projectCode: "EG2",
		blockName: "A",
		units: units(LABELS_PER_SHEET),
	},
} satisfies Meta<typeof QrLabelSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A full sheet: three columns by seven rows of Avery L7160 stock. */
export const FullSheet: Story = {};

/** Fewer Units than a sheet holds; the rest of the paper is left blank. */
export const PartSheet: Story = { args: { units: units(5) } };

/** More than one sheet: the second is left short rather than filled. */
export const TwoSheets: Story = {
	args: { units: [...units(LABELS_PER_SHEET), ...units(3, "02")] },
};
