import type { Route } from "@playwright/test";
import { fakeItemId, unitItems, unitsOf } from "./assignments-api";
import { newestFirst } from "./catalogue-items-api";
import { nextEntry } from "./fake-shared";
import type { FakeProject } from "./projects-api";
import { administrator } from "./provider";
import type { FakeSubcontractor } from "./subcontractors-api";

// The browser-edge fake of the Progress entry routes. It implements the API
// contract only, never backend internals: an entry is appended, the Item's
// Progression becomes its value and its entry count grows, so later specs
// can assert the roll-ups.
/** The Console's entries are the signed-in Administrator's, named by email. */
const author = {
	enteredByKind: "administrator",
	enteredByName: administrator.email,
	subcontractorName: null,
} as const;

export const handleProgressEntries = async (
	route: Route,
	records: Array<FakeProject>,
	directory: Array<FakeSubcontractor>
): Promise<boolean> => {
	const request = route.request();
	const match = /^\/api\/v1\/projects\/([^/]+)\/items\/([^/]+)\/entries$/.exec(
		new URL(request.url()).pathname
	);
	const method = request.method();
	if (!match || (method !== "POST" && method !== "GET")) return false;
	const project = records.find(
		(record) => record.id === decodeURIComponent(match[1]!)
	);
	const itemId = decodeURIComponent(match[2]!);
	const held =
		project &&
		unitsOf(project)
			.flatMap((unit) => (unit.items ?? []).map((item) => ({ unit, item })))
			.find(({ unit, item }) => fakeItemId(unit, item) === itemId);
	if (!project || !held) {
		await route.fulfill({
			status: 404,
			json: { error: { code: "NOT_FOUND", message: "Item not found" } },
		});
		return true;
	}
	const entries = (held.item.entries ??= []);
	if (method === "GET") {
		await route.fulfill({ json: { data: newestFirst(entries) } });
		return true;
	}
	const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
	const value = body["value"];
	const note = body["note"];
	const trimmedNote = typeof note === "string" ? note.trim() : undefined;
	const fieldErrors: Record<string, Array<string>> = {};
	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < 0 ||
		value > 100
	)
		fieldErrors["value"] = ["Expected a whole number from 0 to 100"];
	if (
		note !== undefined &&
		(typeof note !== "string" || !trimmedNote || trimmedNote.length > 200)
	)
		fieldErrors["note"] = ["Expected 1 to 200 characters"];
	if (Object.keys(fieldErrors).length > 0) {
		await route.fulfill({
			status: 400,
			json: {
				error: {
					code: "BAD_REQUEST",
					message: "Invalid request body",
					details: { formErrors: [], fieldErrors },
				},
			},
		});
		return true;
	}
	if (!held.item.subcontractorId) {
		await route.fulfill({
			status: 409,
			json: {
				error: {
					code: "ITEM_UNASSIGNED",
					message: "An Item with no Assignment accepts no Progress entry",
				},
			},
		});
		return true;
	}
	entries.push(nextEntry(author, value as number, trimmedNote ?? null));
	held.item.progression = value as number;
	held.item.entryCount += 1;
	await route.fulfill({
		status: 201,
		json: { data: unitItems(project, held.unit, directory) },
	});
	return true;
};
