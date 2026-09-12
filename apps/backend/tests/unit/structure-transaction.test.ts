import { Prisma } from "@prisma/client";
import { beforeEach, expect, it, vi } from "vitest";
import { serializable } from "@/services/structure-batch.js";
const transaction = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma.js", () => ({ prisma: { $transaction: transaction } }));
beforeEach(() => {
	transaction.mockReset();
});
it.each([
	"Error in connector: Error querying the database: ERROR: could not serialize access due to read/write dependencies among transactions",
	"Error querying the database: ERROR: could not serialize access due to concurrent update",
	"Error querying the database: ERROR: deadlock detected",
	"Transaction failed due to a write conflict or a deadlock. Please retry your transaction",
])(
	"retries the full transaction after a recognized COMMIT failure: %s",
	async (message) => {
		const work = vi.fn().mockResolvedValue("complete");
		transaction
			.mockImplementationOnce(async (callback) => {
				await callback();
				throw new Prisma.PrismaClientUnknownRequestError(message, {
					clientVersion: "6.19.3",
				});
			})
			.mockImplementation(async (callback) => callback());
		await expect(serializable(work)).resolves.toBe("complete");
		expect(work).toHaveBeenCalledTimes(2);
		expect(transaction).toHaveBeenCalledTimes(2);
	}
);
it.each([
	"Server has closed the connection",
	"Error during COMMIT: connection reset by peer",
	"Unknown database failure",
	"Could not serialize value to JSON",
])("does not retry an unrelated unknown error: %s", async (message) => {
	const error = new Prisma.PrismaClientUnknownRequestError(message, {
		clientVersion: "6.19.3",
	});
	transaction.mockRejectedValue(error);
	await expect(serializable(vi.fn())).rejects.toBe(error);
	expect(transaction).toHaveBeenCalledTimes(1);
});
it("caps recognized commit retries at four attempts", async () => {
	const error = new Prisma.PrismaClientUnknownRequestError(
		"ERROR: deadlock detected",
		{ clientVersion: "6.19.3" }
	);
	transaction.mockRejectedValue(error);
	await expect(serializable(vi.fn())).rejects.toBe(error);
	expect(transaction).toHaveBeenCalledTimes(4);
});
it("preserves explicit timeout and opt-in unique retries", async () => {
	transaction
		.mockRejectedValueOnce(
			new Prisma.PrismaClientKnownRequestError("unique", {
				code: "P2002",
				clientVersion: "6.19.3",
			})
		)
		.mockResolvedValue("complete");
	await expect(serializable(vi.fn(), 30000, true)).resolves.toBe("complete");
	expect(transaction).toHaveBeenCalledTimes(2);
	expect(transaction.mock.calls[1]?.[1]).toEqual({
		isolationLevel: "Serializable",
		timeout: 30000,
	});
});
it("does not retry a unique conflict without opting in", async () => {
	const error = new Prisma.PrismaClientKnownRequestError("unique", {
		code: "P2002",
		clientVersion: "6.19.3",
	});
	transaction.mockRejectedValue(error);
	await expect(serializable(vi.fn())).rejects.toBe(error);
	expect(transaction).toHaveBeenCalledTimes(1);
});
it("does not retry non-Prisma errors even with a matching message", async () => {
	const error = new Error("ERROR: deadlock detected");
	transaction.mockRejectedValue(error);
	await expect(serializable(vi.fn())).rejects.toBe(error);
	expect(transaction).toHaveBeenCalledTimes(1);
});
