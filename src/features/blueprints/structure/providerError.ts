export type StructureUniqueField = "number" | "code" | "assetTag";

export type ProviderErrorResult =
	| { kind: "field"; field: StructureUniqueField; messageKey: string }
	| { kind: "blocked-delete"; messageKey: string }
	| { kind: "generic"; messageKey: string };

type ProviderErrorLike = {
	code?: unknown;
	constraint?: unknown;
	message?: unknown;
};

const detail = (value: unknown) => (typeof value === "string" ? value : "");

const uniqueConstraints: Array<[RegExp, StructureUniqueField, string]> = [
	[
		/storey.*number|number.*storey/i,
		"number",
		"blueprints.errors.duplicateStoreyNumber",
	],
	[
		/floor.*plan.*code|code.*floor.*plan/i,
		"code",
		"blueprints.errors.duplicateFloorPlanCode",
	],
	[/unit.*code|code.*unit/i, "code", "blueprints.errors.duplicateUnitCode"],
	[
		/asset.*tag|tag.*installation/i,
		"assetTag",
		"blueprints.errors.duplicateAssetTag",
	],
];

/** Maps provider details without coupling a component to Supabase's error class. */
export const mapProviderError = (error: unknown): ProviderErrorResult => {
	if (!error || typeof error !== "object") {
		return { kind: "generic", messageKey: "blueprints.errors.generic" };
	}
	const candidate = error as ProviderErrorLike;
	const details = `${detail(candidate.constraint)} ${detail(candidate.message)}`;
	if (candidate.code === "23505") {
		const match = uniqueConstraints.find(([pattern]) => pattern.test(details));
		if (match) {
			return { kind: "field", field: match[1], messageKey: match[2] };
		}
	}
	if (candidate.code === "23503") {
		return {
			kind: "blocked-delete",
			messageKey: "blueprints.errors.blockedDelete",
		};
	}
	return { kind: "generic", messageKey: "blueprints.errors.generic" };
};
