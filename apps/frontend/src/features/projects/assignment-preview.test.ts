import { expect, it } from "vitest";
import { previewAssignment } from "@/features/projects/assignment-preview";
import type { Unit } from "@/features/projects/types";

const unit = (
	id: string,
	items: Array<{ catalogueItemId: string; subcontractorId: string | null }>
): Unit => ({
	id,
	name: id,
	position: 0,
	unitTypeId: null,
	itemCount: items.length,
	entryCount: 0,
	progression: items.length ? 0 : null,
	items: items.map((item) => ({ ...item, entryCount: 0 })),
});
// Wardrobe: u1 unassigned, u2 Bolt, u3 unassigned, u4 Acme; u5 holds only a Sink.
const selected = [
	unit("u1", [{ catalogueItemId: "wardrobe", subcontractorId: null }]),
	unit("u2", [{ catalogueItemId: "wardrobe", subcontractorId: "bolt" }]),
	unit("u3", [
		{ catalogueItemId: "sink", subcontractorId: "acme" },
		{ catalogueItemId: "wardrobe", subcontractorId: null },
	]),
	unit("u4", [{ catalogueItemId: "wardrobe", subcontractorId: "acme" }]),
	unit("u5", [{ catalogueItemId: "sink", subcontractorId: null }]),
];

it("counts the Catalogue Item's Items by how they stand against the target Subcontractor", () => {
	expect(previewAssignment(selected, "wardrobe", "acme")).toEqual({
		unassigned: 2,
		elsewhere: 1,
		same: 1,
	});
	expect(previewAssignment(selected, "wardrobe", "bolt")).toEqual({
		unassigned: 2,
		elsewhere: 1,
		same: 1,
	});
	expect(previewAssignment(selected, "wardrobe", "new")).toEqual({
		unassigned: 2,
		elsewhere: 2,
		same: 0,
	});
});
it("counts every Assignment as elsewhere when unassigning", () => {
	expect(previewAssignment(selected, "wardrobe", null)).toEqual({
		unassigned: 2,
		elsewhere: 2,
		same: 0,
	});
});
it("ignores Units without the Item and an empty selection", () => {
	expect(previewAssignment(selected, "sink", "acme")).toEqual({
		unassigned: 1,
		elsewhere: 0,
		same: 1,
	});
	expect(previewAssignment([], "wardrobe", "acme")).toEqual({
		unassigned: 0,
		elsewhere: 0,
		same: 0,
	});
});
