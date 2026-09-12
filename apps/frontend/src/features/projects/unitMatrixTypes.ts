export interface UnitMatrixWarning {
	code:
		| "EMPTY_STOREY"
		| "DUPLICATE_STOREY"
		| "NON_CONSECUTIVE_STACKS"
		| "INFERRED_STACKS"
		| "EMPTY_BLOCK";
	label?: string;
	message: string;
}
export interface UnitMatrixBlock {
	name: string;
	stacks: Array<string>;
	storeys: Array<{ name: string; cells: Array<string | null> }>;
	unitCount: number;
	warnings: Array<UnitMatrixWarning>;
}
export interface UnitMatrixPreview {
	sheets: Array<{
		name: string;
		blocks: Array<UnitMatrixBlock>;
		warnings: Array<UnitMatrixWarning>;
	}>;
}
