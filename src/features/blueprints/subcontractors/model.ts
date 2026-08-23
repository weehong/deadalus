import type {
	ScopeAssignment,
	ScopeCode,
	Subcontractor,
	Unit,
} from "../data/database";
export const SCOPE_CODES: ReadonlyArray<ScopeCode> = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
];
export type CheckState = "none" | "some" | "all";
export const unitCheckState = (
	unitId: string,
	subcontractorId: string,
	assignments: Array<ScopeAssignment>
): CheckState => {
	const count = new Set(
		assignments
			.filter(
				(a) => a.unit_id === unitId && a.subcontractor_id === subcontractorId
			)
			.map((a) => a.scope_code)
	).size;
	return count === 0 ? "none" : count === SCOPE_CODES.length ? "all" : "some";
};
export const unitToggleCodes = (
	state: CheckState,
	defaults: Array<ScopeCode>
): Array<ScopeCode> =>
	state === "all"
		? []
		: state === "none" && defaults.length > 0
			? defaults
			: [...SCOPE_CODES];
export const otherHolders = (
	unitId: string,
	code: ScopeCode,
	selectedId: string,
	assignments: Array<ScopeAssignment>,
	subcontractors: Array<Subcontractor>
): Array<string> =>
	assignments
		.filter(
			(a) =>
				a.unit_id === unitId &&
				a.scope_code === code &&
				a.subcontractor_id !== selectedId
		)
		.map(
			(a) =>
				subcontractors.find((s) => s.id === a.subcontractor_id)?.company_name
		)
		.filter((name): name is string => Boolean(name));
export type ScopeSheetRow = { unit: Unit; codes: Array<ScopeCode> };
export const deriveScopeSheet = (
	subcontractorId: string,
	units: Array<Unit>,
	assignments: Array<ScopeAssignment>
): Array<ScopeSheetRow> =>
	units
		.map((unit) => ({
			unit,
			codes: assignments
				.filter(
					(a) => a.subcontractor_id === subcontractorId && a.unit_id === unit.id
				)
				.map((a) => a.scope_code)
				.sort(),
		}))
		.filter(({ codes }) => codes.length > 0);
export const deriveCoverage = (
	units: Array<Unit>,
	assignments: Array<ScopeAssignment>
) => {
	const keys = units.flatMap((unit) =>
		SCOPE_CODES.map((code) => `${unit.id}:${code}`)
	);
	const counts = new Map<string, number>();
	assignments.forEach((a) =>
		counts.set(
			`${a.unit_id}:${a.scope_code}`,
			(counts.get(`${a.unit_id}:${a.scope_code}`) ?? 0) + 1
		)
	);
	return {
		covered: keys.filter((key) => (counts.get(key) ?? 0) > 0).length,
		unassigned: keys.filter((key) => !counts.has(key)).length,
		doubleAssigned: keys.filter((key) => (counts.get(key) ?? 0) > 1).length,
		total: keys.length,
	};
};
