import { Prisma } from "@prisma/client";
import { nameKey } from "@/lib/name-key.js";
import { HttpError } from "@/lib/http-error.js";
import { prisma } from "@/lib/prisma.js";
import { deleteUnlessHeld } from "@/services/delete-unless-held.js";
import type {
	ListSubcontractorsQuery,
	MemberBody,
	EditMemberBody,
	CreateSubcontractorBody,
	RenameSubcontractorBody,
} from "@/schemas/subcontractors.schema.js";

export interface SubcontractorRow {
	readonly id: string;
	readonly name: string;
	readonly memberCount: number;
	readonly phones: Array<string>;
}
export interface SubcontractorListing {
	readonly rows: Array<SubcontractorRow>;
	readonly total: number;
}

export async function listSubcontractors(
	query: ListSubcontractorsQuery
): Promise<SubcontractorListing> {
	const { page, pageSize, q } = query;
	const phoneDigits = q?.replace(/\D/g, "");
	// Prisma's contains uses LIKE; searches are literal substrings, not patterns.
	const nameSubstring = (q ?? "").replace(/[\\%_]/g, "\\$&");
	const where: Prisma.SubcontractorWhereInput = q
		? {
				OR: [
					{ name: { contains: nameSubstring, mode: "insensitive" } },
					{
						members: {
							some: { name: { contains: nameSubstring, mode: "insensitive" } },
						},
					},
					// Stored phones are E.164; their only non-digit is the leading +.
					...(phoneDigits
						? [{ members: { some: { phone: { contains: phoneDigits } } } }]
						: []),
				],
			}
		: {};
	const [records, total] = await prisma.$transaction([
		prisma.subcontractor.findMany({
			where,
			orderBy: [{ nameKey: "asc" }, { id: "asc" }],
			skip: (page - 1) * pageSize,
			take: pageSize,
			select: {
				id: true,
				name: true,
				members: {
					select: { phone: true },
					orderBy: [{ name: "asc" }, { phone: "asc" }],
				},
			},
		}),
		prisma.subcontractor.count({ where }),
	]);
	return {
		rows: records.map((record) => ({
			id: record.id,
			name: record.name,
			memberCount: record.members.length,
			phones: record.members.map((member) => member.phone),
		})),
		total,
	};
}

export interface Member {
	readonly id: string;
	readonly name: string;
	readonly phone: string;
}
export interface Subcontractor {
	readonly id: string;
	readonly name: string;
	readonly members: Array<Member>;
}
/** The full Subcontractor every read and write returns; the database orders Members. */
const subcontractorSelect = {
	id: true,
	name: true,
	members: {
		select: { id: true, name: true, phone: true },
		orderBy: [{ name: "asc" }, { phone: "asc" }],
	},
} satisfies Prisma.SubcontractorSelect;

export async function getSubcontractor(id: string): Promise<Subcontractor> {
	const record = await prisma.subcontractor.findUnique({
		where: { id },
		select: subcontractorSelect,
	});
	if (!record) throw HttpError.notFound("Subcontractor not found");
	return record;
}

/** A Subcontractor holding an Assignment cannot be deleted; the count comes back with the refusal. */
export async function deleteSubcontractor(id: string): Promise<void> {
	await deleteUnlessHeld(
		{ subcontractorId: id },
		{
			code: "SUBCONTRACTOR_HAS_ASSIGNMENTS",
			message: "Items are still assigned to this Subcontractor",
			changedMessage: "Assignments changed; refresh and try again",
		},
		async () => {
			const { count } = await prisma.subcontractor.deleteMany({
				where: { id },
			});
			if (count === 0) throw HttpError.notFound("Subcontractor not found");
		}
	);
}

export async function removeMember(
	id: string,
	memberId: string
): Promise<void> {
	// Serializable isolation makes two concurrent count-and-delete operations
	// conflict instead of allowing both to remove the final two Members.
	const attemptRemoval = async (attempt: number): Promise<void> => {
		try {
			await prisma.$transaction(
				async (transaction) => {
					const member = await transaction.member.findFirst({
						where: { id: memberId, subcontractorId: id },
						select: { id: true },
					});
					if (!member) throw HttpError.notFound("Member not found");
					const memberCount = await transaction.member.count({
						where: { subcontractorId: id },
					});
					if (memberCount <= 1)
						throw HttpError.conflict(
							"LAST_MEMBER",
							"A Subcontractor must keep at least one Member."
						);
					await transaction.member.delete({
						where: { id: memberId, subcontractorId: id },
					});
				},
				{ isolationLevel: "Serializable" }
			);
			return;
		} catch (error) {
			if (
				typeof error !== "object" ||
				error === null ||
				!("code" in error) ||
				error.code !== "P2034" ||
				attempt === 2
			)
				throw error;
			return attemptRemoval(attempt + 1);
		}
	};
	await attemptRemoval(0);
}

/** Translate database constraints after a failed write, including concurrent conflicts. */
export async function rethrowSubcontractorConflict(
	error: unknown,
	phone?: string
): Promise<never> {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	) {
		const target = error.meta?.["target"];
		const constraints = Array.isArray(target) ? target : [target];
		if (
			constraints.includes("nameKey") ||
			constraints.includes("subcontractors_nameKey_key")
		) {
			throw HttpError.conflict(
				"SUBCONTRACTOR_NAME_TAKEN",
				"A Subcontractor with this name already exists"
			);
		}
		if (
			phone &&
			(constraints.includes("phone") ||
				constraints.includes("members_phone_key"))
		) {
			const member = await prisma.member.findUnique({
				where: { phone },
				select: { subcontractor: { select: { id: true, name: true } } },
			});
			throw HttpError.conflict(
				"MEMBER_PHONE_TAKEN",
				"This phone number already belongs to a Member",
				member
					? {
							subcontractorId: member.subcontractor.id,
							subcontractorName: member.subcontractor.name,
						}
					: undefined
			);
		}
	}
	throw error;
}

/** Prisma's nested write commits the Subcontractor and first Member atomically. */
export async function createSubcontractor(
	input: CreateSubcontractorBody
): Promise<Subcontractor> {
	try {
		return await prisma.subcontractor.create({
			data: {
				name: input.name,
				nameKey: nameKey(input.name),
				members: { create: input.member },
			},
			select: subcontractorSelect,
		});
	} catch (error) {
		return rethrowSubcontractorConflict(error, input.member.phone);
	}
}

export async function renameSubcontractor(
	id: string,
	input: RenameSubcontractorBody
): Promise<Subcontractor> {
	try {
		return await prisma.subcontractor.update({
			where: { id },
			data: { name: input.name, nameKey: nameKey(input.name) },
			select: subcontractorSelect,
		});
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		)
			throw HttpError.notFound("Subcontractor not found");
		return rethrowSubcontractorConflict(error);
	}
}

export async function addMember(
	id: string,
	input: MemberBody
): Promise<Subcontractor> {
	await getSubcontractor(id);
	try {
		await prisma.member.create({ data: { ...input, subcontractorId: id } });
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2003"
		)
			throw HttpError.notFound("Subcontractor not found");
		return rethrowSubcontractorConflict(error, input.phone);
	}
	return getSubcontractor(id);
}

export async function editMember(
	id: string,
	memberId: string,
	input: EditMemberBody
): Promise<Subcontractor> {
	const where = { id: memberId, subcontractorId: id };
	const member = await prisma.member.findFirst({ where, select: { id: true } });
	if (!member) throw HttpError.notFound("Member not found");
	try {
		await prisma.member.update({ where, data: input });
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		)
			throw HttpError.notFound("Member not found");
		return rethrowSubcontractorConflict(error, input.phone);
	}
	return getSubcontractor(id);
}
