import { describe, expect, it } from "vitest";
import { mapProviderError } from "./providerError";

describe("mapProviderError", () => {
	it.each([
		[
			"storeys_site_id_number_key",
			"number",
			"blueprints.errors.duplicateStoreyNumber",
		],
		[
			"floor_plans_site_id_code_key",
			"code",
			"blueprints.errors.duplicateFloorPlanCode",
		],
		["units_site_id_code_key", "code", "blueprints.errors.duplicateUnitCode"],
		[
			"installations_site_id_asset_tag_key",
			"assetTag",
			"blueprints.errors.duplicateAssetTag",
		],
	])("maps %s to its field", (constraint, field, messageKey) => {
		expect(mapProviderError({ code: "23505", constraint })).toEqual({
			kind: "field",
			field,
			messageKey,
		});
	});

	it("maps a foreign-key violation to a blocked delete", () => {
		expect(mapProviderError({ code: "23503" })).toEqual({
			kind: "blocked-delete",
			messageKey: "blueprints.errors.blockedDelete",
		});
	});

	it("maps unknown errors to a generic alert", () => {
		expect(mapProviderError(new Error("offline"))).toEqual({
			kind: "generic",
			messageKey: "blueprints.errors.generic",
		});
	});
});
