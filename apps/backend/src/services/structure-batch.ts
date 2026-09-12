import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { nameKey } from "@/lib/name-key.js";
import { HttpError } from "@/lib/http-error.js";
export function findClashingNames(
	names: Array<string>,
	existingKeys: Iterable<string>
): Array<string> {
	const keys = new Set(existingKeys);
	return names.filter((name) => keys.has(nameKey(name)));
}
export function assertNoNameClashes(
	names: Array<string>,
	existingKeys: Iterable<string>,
	code: string
): void {
	const clashes = findClashingNames(names, existingKeys);
	if (clashes.length)
		throw HttpError.conflict(code, "Names already exist", { names: clashes });
}
/** The library engine can return COMMIT failures without Prisma's P2034 code. */
function isRetryableTransactionError(
	error: unknown,
	retryUnique: boolean
): boolean {
	if (error instanceof Prisma.PrismaClientKnownRequestError)
		return error.code === "P2034" || (retryUnique && error.code === "P2002");
	if (!(error instanceof Prisma.PrismaClientUnknownRequestError)) return false;
	// Only explicit database concurrency messages establish that retrying is safe.
	// Connection failures can leave COMMIT's outcome unknown and must not be retried.
	return /\bcould not serialize access due to\b|\bdeadlock detected\b|\bTransaction failed due to a write conflict or a deadlock\. Please retry your transaction\b/i.test(
		error.message
	);
}
/** Retry the entire unit of work, including sibling reads, after serialization failure. */
export async function serializable<T>(
	work: (transaction: Prisma.TransactionClient) => Promise<T>,
	timeout = 5000,
	retryUnique = false
): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			// Each retry must wait for the previous transaction to roll back.
			// eslint-disable-next-line no-await-in-loop
			return await prisma.$transaction(work, {
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
				timeout,
			});
		} catch (error) {
			if (!isRetryableTransactionError(error, retryUnique) || attempt >= 3)
				throw error;
		}
	}
}
