import { ApiRequestError } from "@/common/api";
/** What the entry form shows when the API refuses an entry: on a field, or on the form. */
export interface ProgressEntryFailure {
	field?: "value" | "note";
	message: string;
}
export type ProgressFailureKey =
	| "projects.progress.unassignedRefused"
	| "projects.progress.valueInvalid"
	| "projects.progress.noteTooLong"
	| "projects.progress.error";
const fieldErrorsOf = (details: unknown): Record<string, unknown> =>
	typeof details === "object" &&
	details !== null &&
	"fieldErrors" in details &&
	typeof details.fieldErrors === "object" &&
	details.fieldErrors !== null
		? (details.fieldErrors as Record<string, unknown>)
		: {};
/**
 * The API's 409 `ITEM_UNASSIGNED` is the refusal on the form; a 400 naming
 * `value` or `note` lands on that field; anything else is a plain failure.
 */
export const progressEntryFailure = (
	error: unknown,
	t: (key: ProgressFailureKey) => string
): ProgressEntryFailure => {
	if (error instanceof ApiRequestError) {
		if (error.code === "ITEM_UNASSIGNED")
			return { message: t("projects.progress.unassignedRefused") };
		if (error.status === 400) {
			const fields = fieldErrorsOf(error.details);
			if ("value" in fields)
				return { field: "value", message: t("projects.progress.valueInvalid") };
			if ("note" in fields)
				return { field: "note", message: t("projects.progress.noteTooLong") };
		}
	}
	return { message: t("projects.progress.error") };
};
