import { Router } from "express";

import {
	createMemberSessionController,
	enterFieldProgressController,
	fieldMeController,
	listFieldProjectsController,
	readFieldProgressEntriesController,
	readFieldProjectController,
	readFieldUnitItemsController,
} from "@/controllers/field.controller.js";
import { requireMember } from "@/middlewares/require-member.js";
import { validate } from "@/middlewares/validate.js";
import {
	fieldItemParametersSchema,
	fieldUnitParametersSchema,
} from "@/schemas/field-items.schema.js";
import { fieldProjectParametersSchema } from "@/schemas/field-projects.schema.js";
import { createMemberSessionBodySchema } from "@/schemas/field.schema.js";
import { progressEntryBodySchema } from "@/schemas/progress-entries.schema.js";

/**
 * The Field's routes. Sign-in is the one route without a Session; everything
 * else sits behind `requireMember`, which loads the Member on every request.
 */
export const fieldRouter: Router = Router();

fieldRouter.post(
	"/sessions",
	validate({ body: createMemberSessionBodySchema }),
	createMemberSessionController
);

fieldRouter.get("/me", requireMember, fieldMeController);

fieldRouter.get("/projects", requireMember, listFieldProjectsController);

fieldRouter.get(
	"/projects/:id",
	requireMember,
	validate({ params: fieldProjectParametersSchema }),
	readFieldProjectController
);

fieldRouter.get(
	"/units/:unitId/items",
	requireMember,
	validate({ params: fieldUnitParametersSchema }),
	readFieldUnitItemsController
);

fieldRouter.post(
	"/items/:itemId/entries",
	requireMember,
	validate({
		params: fieldItemParametersSchema,
		body: progressEntryBodySchema,
	}),
	enterFieldProgressController
);

fieldRouter.get(
	"/items/:itemId/entries",
	requireMember,
	validate({ params: fieldItemParametersSchema }),
	readFieldProgressEntriesController
);
