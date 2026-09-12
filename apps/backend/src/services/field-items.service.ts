import type { Prisma } from "@prisma/client";
import { HttpError } from "@/lib/http-error.js";
import { prisma } from "@/lib/prisma.js";
import type { FieldUnitItems } from "@/schemas/field-items.schema.js";
import type {
	ProgressEntry,
	ProgressEntryBody,
} from "@/schemas/progress-entries.schema.js";
import type { MemberIdentity } from "@/services/member-auth.service.js";
import {
	enterProgress,
	readProgressEntries,
} from "@/services/progress-entries.service.js";
import { readItems } from "@/services/unit-items.service.js";

/**
 * The Field's Unit screen: the Subcontractor's Items in one Unit, a
 * Member's Progress entry and an Item's history. Every read and write is
 * scoped to the Subcontractor of the Member behind the token (ADR-0003);
 * nothing here takes a Subcontractor id from a request. A Unit where the
 * Subcontractor holds nothing, and an Item it does not hold, are 404s
 * indistinguishable from an unknown id.
 */

const fieldUnitSelect = {
	id: true,
	name: true,
	storey: {
		select: {
			id: true,
			name: true,
			block: {
				select: {
					id: true,
					name: true,
					project: { select: { id: true, code: true, name: true } },
				},
			},
		},
	},
} satisfies Prisma.UnitSelect;

/** The heading and the Subcontractor's Items of one Unit; a 404 where it holds none. */
export async function readFieldUnitItems(
	unitId: string,
	subcontractorId: string,
	database: Pick<Prisma.TransactionClient, "unit" | "item"> = prisma
): Promise<FieldUnitItems> {
	const [record, items] = await Promise.all([
		database.unit.findUnique({
			where: { id: unitId },
			select: fieldUnitSelect,
		}),
		readItems({ subcontractorId }, unitId, database),
	]);
	if (!record || items.length === 0) throw HttpError.notFound("Unit not found");
	const { storey } = record;
	return {
		project: storey.block.project,
		block: { id: storey.block.id, name: storey.block.name },
		storey: { id: storey.id, name: storey.name },
		unit: { id: record.id, name: record.name },
		items,
	};
}

/**
 * Enter progress on one of the Subcontractor's Items as the Member: the
 * same one-transaction write as the Console's route, with the Member as
 * the author and its Subcontractor's name snapshotted. Answers with the
 * Unit as the Field reads it.
 */
export async function enterFieldProgress(
	itemId: string,
	body: ProgressEntryBody,
	member: MemberIdentity
): Promise<FieldUnitItems> {
	const subcontractorId = member.subcontractor.id;
	return enterProgress(
		{ subcontractorId },
		itemId,
		body,
		{
			kind: "member",
			id: member.id,
			name: member.name,
			subcontractorName: member.subcontractor.name,
		},
		(unitId, tx) => readFieldUnitItems(unitId, subcontractorId, tx)
	);
}

/** The history of one of the Subcontractor's Items, newest first. */
export async function readFieldProgressEntries(
	itemId: string,
	subcontractorId: string
): Promise<Array<ProgressEntry>> {
	return readProgressEntries({ subcontractorId }, itemId);
}
