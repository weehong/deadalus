import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
import type {
	ProgressEntry,
	ProgressEntryBody,
} from "@/schemas/progress-entries.schema.js";
import type { UnitItem } from "@/schemas/unit-items.schema.js";
import type { AuthenticatedUser } from "@/services/auth.service.js";
import { itemWhere, type ItemScope } from "@/services/item-scope.js";
import { readUnitItems } from "@/services/unit-items.service.js";

/**
 * Who makes a Progress entry, as snapshotted on it: an Administrator (the
 * token's subject and email) or a Member (its id and name, with its
 * Subcontractor's name at the time).
 */
export interface ProgressAuthor {
	readonly kind: "administrator" | "member";
	readonly id: string;
	readonly name: string;
	/** The Member's Subcontractor; an Administrator has none. */
	readonly subcontractorName?: string;
}

/** The Item within the scope; outside it is a 404, never a 403. */
async function requireItem(
	scope: ItemScope,
	itemId: string,
	database: Pick<Prisma.TransactionClient, "item">
): Promise<{ id: string; unitId: string; subcontractorId: string | null }> {
	const item = await database.item.findFirst({
		where: { id: itemId, ...itemWhere(scope) },
		select: { id: true, unitId: true, subcontractorId: true },
	});
	if (!item) throw HttpError.notFound("Item not found");
	return item;
}

/**
 * Enter a Progress entry on an Item. The entry is appended and the Item's
 * stored Progression set to its value in one transaction, so the two never
 * drift (ADR-0008). An Item with no Assignment accepts none; a later value
 * may be lower than the last. The author is snapshotted on the entry.
 * Answers with whatever `readUnit` reads of the Item's Unit inside the same
 * transaction: the Console's Unit card Items, or the Field's Unit screen.
 */
export async function enterProgress<T>(
	scope: ItemScope,
	itemId: string,
	body: ProgressEntryBody,
	author: ProgressAuthor,
	readUnit: (unitId: string, tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
	return prisma.$transaction(async (tx) => {
		const item = await requireItem(scope, itemId, tx);
		if (item.subcontractorId === null)
			throw HttpError.conflict(
				"ITEM_UNASSIGNED",
				"An Item with no Assignment accepts no Progress entry"
			);
		await tx.progressEntry.create({
			data: {
				itemId: item.id,
				value: body.value,
				note: body.note ?? null,
				enteredByKind: author.kind,
				enteredById: author.id,
				enteredByName: author.name,
				subcontractorName: author.subcontractorName,
			},
		});
		await tx.item.update({
			where: { id: item.id },
			data: { progression: body.value },
		});
		return readUnit(item.unitId, tx);
	});
}

/**
 * Enter progress on an Item of the Project as the Administrator behind the
 * token, named by email (or subject when the token carries none). Answers
 * with the Unit card's Items, read inside the same transaction.
 */
export async function enterConsoleProgress(
	projectId: string,
	itemId: string,
	body: ProgressEntryBody,
	user: AuthenticatedUser
): Promise<Array<UnitItem>> {
	return enterProgress(
		{ projectId },
		itemId,
		body,
		{ kind: "administrator", id: user.id, name: user.email ?? user.id },
		(unitId, tx) => readUnitItems(projectId, unitId, tx)
	);
}

/** An Item's history, newest first. */
export async function readProgressEntries(
	scope: ItemScope,
	itemId: string
): Promise<Array<ProgressEntry>> {
	const item = await requireItem(scope, itemId, prisma);
	const entries = await prisma.progressEntry.findMany({
		where: { itemId: item.id },
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		select: {
			id: true,
			value: true,
			note: true,
			enteredByKind: true,
			enteredByName: true,
			subcontractorName: true,
			createdAt: true,
		},
	});
	return entries.map((entry) => ({
		id: entry.id,
		value: entry.value,
		note: entry.note,
		enteredByKind: entry.enteredByKind,
		enteredByName: entry.enteredByName,
		subcontractorName: entry.subcontractorName,
		createdAt: entry.createdAt.toISOString(),
	}));
}
