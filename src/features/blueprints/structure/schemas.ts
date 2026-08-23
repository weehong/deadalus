import { z } from "zod";

export type StructureValidationMessages = {
	required: string;
	levelOrder: string;
	nonNegative: string;
};

export const defaultStructureValidationMessages: StructureValidationMessages = {
	required: "This field is required",
	levelOrder: "Level to must be above level from",
	nonNegative: "Enter zero or a positive number",
};

const requiredText = (message: string) => z.string().trim().min(1, message);
const nonNegative = (messages: StructureValidationMessages) =>
	z.number({ error: messages.required }).finite().min(0, messages.nonNegative);

export const createStoreySchema = (
	messages = defaultStructureValidationMessages
) =>
	z
		.object({
			name: requiredText(messages.required),
			number: z
				.number({ error: messages.required })
				.int()
				.nonnegative(messages.nonNegative),
			levelFrom: z.number({ error: messages.required }).finite(),
			levelTo: z.number({ error: messages.required }).finite(),
			structuralNote: z.string().trim(),
		})
		.refine(({ levelFrom, levelTo }) => levelTo > levelFrom, {
			message: messages.levelOrder,
			path: ["levelTo"],
		});

export const createFloorPlanSchema = (
	messages = defaultStructureValidationMessages
) =>
	z.object({
		name: requiredText(messages.required),
		code: requiredText(messages.required),
		storeyId: requiredText(messages.required),
		slabLevel: z.number({ error: messages.required }).finite(),
		grossArea: nonNegative(messages),
		structuralGrid: z.string().trim(),
	});

export const createUnitSchema = (
	messages = defaultStructureValidationMessages
) =>
	z.object({
		code: requiredText(messages.required),
		floorPlanId: requiredText(messages.required),
		usableArea: nonNegative(messages),
		entryDoor: z.string().trim(),
		roomTags: z.string().trim(),
		boundaryNote: z.string().trim(),
	});

export const storeySchema = createStoreySchema();
export const floorPlanSchema = createFloorPlanSchema();
export const unitSchema = createUnitSchema();

export type StoreyFormValues = z.infer<typeof storeySchema>;
export type FloorPlanFormValues = z.infer<typeof floorPlanSchema>;
export type UnitFormValues = z.infer<typeof unitSchema>;
