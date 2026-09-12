import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitMatrixEditor } from "@/features/projects/UnitMatrixEditor";
import { matrixErrors } from "@/features/projects/matrix-to-structure";
const meta = {
	title: "Projects/UnitMatrixEditor",
	component: UnitMatrixEditor,
	args: {
		value: {
			name: "West",
			stacks: ["1", "2"],
			storeys: [
				{ name: "01", cells: ["BP2(p) (M)", "A1"] },
				{ name: "Roof", cells: ["PH", null] },
			],
			unitCount: 3,
			warnings: [],
		},
		onChange: (): void => {},
	},
	render: function EditorStory(args): React.ReactElement {
		const [value, setValue] = useState(args.value);
		return (
			<UnitMatrixEditor
				{...args}
				errors={matrixErrors([value])}
				value={value}
				onChange={setValue}
			/>
		);
	},
} satisfies Meta<typeof UnitMatrixEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const DuplicateUnits: Story = {
	args: { value: { ...meta.args.value, stacks: ["1", "01"] } },
};
