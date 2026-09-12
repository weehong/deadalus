import type { UnitMatrixBlock } from "@/features/projects/unitMatrixTypes";
import { nameKey } from "@/features/projects/name-generator";
export interface StructureBody {
	blocks: Array<{
		name: string;
		storeys: Array<{
			name: string;
			units: Array<{ name: string; unitTypeCode?: string }>;
		}>;
	}>;
}
export interface BlockSelection {
	name: string;
	included: boolean;
}
export const stackUnitName = (stack: string): string =>
	stack.trim().padStart(2, "0");

export function matrixToStructure(
	blocks: Array<UnitMatrixBlock>
): StructureBody {
	return {
		blocks: blocks.map((block) => ({
			name: block.name.trim(),
			storeys: block.storeys
				.map((storey) => ({
					name: storey.name,
					units: storey.cells.flatMap((code, index) =>
						!code?.trim()
							? []
							: [
									{
										name: stackUnitName(block.stacks[index] ?? ""),
										unitTypeCode: code.trim(),
									},
								]
					),
				}))
				.filter((storey) => storey.units.length > 0),
		})),
	};
}
export function blockNameErrors(
	selections: Array<BlockSelection>
): Array<"invalid" | "duplicate" | undefined> {
	const counts = new Map<string, number>();
	for (const selection of selections)
		if (selection.included)
			counts.set(
				nameKey(selection.name),
				(counts.get(nameKey(selection.name)) ?? 0) + 1
			);
	return selections.map((selection) =>
		!selection.included
			? undefined
			: !selection.name.trim() || selection.name.trim().length > 60
				? "invalid"
				: (counts.get(nameKey(selection.name)) ?? 0) > 1
					? "duplicate"
					: undefined
	);
}

export interface MatrixError {
	code:
		| "noBlocks"
		| "caps"
		| "invalidBlock"
		| "duplicateBlock"
		| "invalidStorey"
		| "duplicateStorey"
		| "invalidUnit"
		| "duplicateUnit"
		| "invalidCode";
	block?: number;
	row?: number;
	column?: number;
}
const invalidName = (name: string): boolean =>
	!name.trim() || name.trim().length > 60;
export const unitTypeCodeKey = (code: string): string =>
	code.replace(/\s+/g, "").toUpperCase();

export function matrixErrors(
	blocks: Array<UnitMatrixBlock>
): Array<MatrixError> {
	const errors: Array<MatrixError> = [];
	if (!blocks.length) errors.push({ code: "noBlocks" });
	const blockErrors = blockNameErrors(
		blocks.map((block) => ({ name: block.name, included: true }))
	);
	let units = 0;
	blocks.forEach((block, blockIndex) => {
		const header = blockErrors[blockIndex];
		if (header)
			errors.push({
				code: header === "invalid" ? "invalidBlock" : "duplicateBlock",
				block: blockIndex,
			});
		const rows = new Map<string, number>();
		block.storeys.forEach((storey) =>
			rows.set(nameKey(storey.name), (rows.get(nameKey(storey.name)) ?? 0) + 1)
		);
		block.storeys.forEach((storey, row) => {
			if (invalidName(storey.name))
				errors.push({ code: "invalidStorey", block: blockIndex, row });
			else if ((rows.get(nameKey(storey.name)) ?? 0) > 1)
				errors.push({ code: "duplicateStorey", block: blockIndex, row });
			const names = new Map<string, number>();
			storey.cells.forEach((cell, column) => {
				if (cell?.trim()) {
					const key = nameKey(stackUnitName(block.stacks[column] ?? ""));
					names.set(key, (names.get(key) ?? 0) + 1);
				}
			});
			storey.cells.forEach((cell, column) => {
				if (!cell?.trim()) return;
				units++;
				const stack = block.stacks[column] ?? "";
				if (invalidName(stack))
					errors.push({ code: "invalidUnit", block: blockIndex, row, column });
				else if ((names.get(nameKey(stackUnitName(stack))) ?? 0) > 1)
					errors.push({
						code: "duplicateUnit",
						block: blockIndex,
						row,
						column,
					});
				if (cell.trim().length > 40)
					errors.push({ code: "invalidCode", block: blockIndex, row, column });
			});
		});
	});
	if (blocks.length > 50 || units > 10000) errors.push({ code: "caps" });
	return errors;
}

export function newUnitTypeCodes(
	block: UnitMatrixBlock,
	existingCodes: Array<string>
): Array<string> {
	const seen = new Set(existingCodes.map(unitTypeCodeKey));
	const codes: Array<string> = [];
	for (const storey of block.storeys)
		for (const cell of storey.cells) {
			const code = cell?.trim();
			if (code && !seen.has(unitTypeCodeKey(code))) {
				codes.push(code);
				seen.add(unitTypeCodeKey(code));
			}
		}
	return codes;
}
export function omittedStoreys(blocks: Array<UnitMatrixBlock>): Array<string> {
	return blocks.flatMap((block) =>
		block.storeys
			.filter((storey) => !storey.cells.some((cell) => cell?.trim()))
			.map((storey) => `${block.name} / ${storey.name}`)
	);
}
