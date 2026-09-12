import { expect, it } from "vitest";
import { ApiRequestError } from "@/common/api";
import {
	progressEntryFailure,
	type ProgressFailureKey,
} from "@/common/progress-entry-failure";
const t = (key: ProgressFailureKey): string => key;
it("puts the unassigned refusal on the form", () => {
	expect(
		progressEntryFailure(
			new ApiRequestError(409, "No Assignment", "ITEM_UNASSIGNED"),
			t
		)
	).toEqual({ message: "projects.progress.unassignedRefused" });
});
it("puts a 400 naming a field on that field, the value first", () => {
	const details = { formErrors: [], fieldErrors: { note: ["Too long"] } };
	expect(
		progressEntryFailure(
			new ApiRequestError(400, "Invalid", "BAD_REQUEST", details),
			t
		)
	).toEqual({ field: "note", message: "projects.progress.noteTooLong" });
	expect(
		progressEntryFailure(
			new ApiRequestError(400, "Invalid", "BAD_REQUEST", {
				fieldErrors: { value: ["Too big"], note: ["Too long"] },
			}),
			t
		)
	).toEqual({ field: "value", message: "projects.progress.valueInvalid" });
});
it("treats a 400 without field errors, any other status and a non-API error as a plain failure", () => {
	for (const error of [
		new ApiRequestError(400, "Invalid", "BAD_REQUEST"),
		new ApiRequestError(400, "Invalid", "BAD_REQUEST", { fieldErrors: null }),
		new ApiRequestError(404, "Item not found", "NOT_FOUND"),
		new ApiRequestError(500, "Boom"),
		new TypeError("Failed to fetch"),
		undefined,
	])
		expect(progressEntryFailure(error, t)).toEqual({
			message: "projects.progress.error",
		});
});
