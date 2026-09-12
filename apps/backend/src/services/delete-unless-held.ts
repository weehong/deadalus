import { Prisma } from "@prisma/client";
import { HttpError } from "@/lib/http-error.js";
import { prisma } from "@/lib/prisma.js";

/** The 409 answered while Items still reference the record, and after a concurrent write beats the check. */
export interface HeldRefusal {
	readonly code: string;
	readonly message: string;
	readonly changedMessage: string;
}

/**
 * Delete a record Items may reference (a Catalogue Item, a Subcontractor)
 * only while none does. The Items are counted first so the refusal can
 * name the count. The database's restrict stays authoritative if an Item
 * is made between the check and the delete: the count is then re-read
 * outside any failed transaction, so the refusal carries the current one.
 */
export async function deleteUnlessHeld(
	held: Prisma.ItemWhereInput,
	refusal: HeldRefusal,
	remove: () => Promise<void>
): Promise<void> {
	const itemCount = await prisma.item.count({ where: held });
	if (itemCount > 0)
		throw HttpError.conflict(refusal.code, refusal.message, { itemCount });
	try {
		await remove();
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2003"
		)
			throw HttpError.conflict(refusal.code, refusal.changedMessage, {
				itemCount: await prisma.item.count({ where: held }),
			});
		throw error;
	}
}
