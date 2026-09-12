import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { UnitSelection } from "@/features/projects/UnitSelection";
import type { Project } from "@/features/projects/types";
import {
	selectAll,
	type UnitSelectionValue,
} from "@/features/projects/unit-selection";
const rollup = { itemCount: 0, entryCount: 0, progression: null };
const unit = (
	id: string,
	name: string,
	unitTypeId: string | null
): Project["blocks"][number]["storeys"][number]["units"][number] => ({
	id,
	name,
	position: 0,
	unitTypeId,
	...rollup,
	items: [],
});
const project: Project = {
	id: "gardens",
	name: "Gardens",
	code: "EG2",
	...rollup,
	blocks: [
		{
			id: "a",
			name: "A",
			position: 0,
			...rollup,
			storeys: [
				{
					id: "a1",
					name: "01",
					position: 0,
					...rollup,
					units: [unit("u1", "01", "as1"), unit("u2", "02", "bp2")],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					...rollup,
					units: [unit("u3", "01", "as1")],
				},
			],
		},
		{
			id: "b",
			name: "B",
			position: 1,
			...rollup,
			storeys: [
				{
					id: "b1",
					name: "01",
					position: 0,
					...rollup,
					units: [unit("u4", "01", "bp2"), unit("u5", "02", null)],
				},
			],
		},
	],
	unitTypes: [
		{ id: "as1", code: "AS1", description: "1 Bedroom + Study", unitCount: 2 },
		{ id: "bp2", code: "BP2", description: "2 Bedroom Premium", unitCount: 2 },
	],
	catalogueItems: [{ id: "wardrobe", name: "Wardrobe", itemCount: 0 }],
};
const Live = ({
	initial,
	disabled,
}: {
	initial: UnitSelectionValue;
	disabled?: boolean;
}): React.ReactElement => {
	const [value, setValue] = useState(initial);
	return (
		<UnitSelection
			disabled={disabled}
			project={project}
			summary={`${String(value.storeyIds.length)} Storeys and ${String(value.unitTypeIds.length)} Unit Types selected`}
			value={value}
			onChange={setValue}
		/>
	);
};
const meta = {
	title: "Projects/UnitSelection",
	component: Live,
	args: { initial: selectAll(project, null) },
} satisfies Meta<typeof Live>;
export default meta;
type Story = StoryObj<typeof meta>;
export const EveryBlock: Story = {};
export const OneBlock: Story = {
	args: { initial: { ...selectAll(project, "a"), unitTypeIds: ["as1"] } },
};
export const Disabled: Story = { args: { disabled: true } };
