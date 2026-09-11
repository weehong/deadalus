import { Router } from "express";
import { requireAuth } from "@/middlewares/require-auth.js";
import { validate } from "@/middlewares/validate.js";
import {
	editMemberController,
	addMemberController,
	deleteSubcontractorController,
	renameSubcontractorController,
	listSubcontractorsController,
	createSubcontractorController,
	getSubcontractorController,
	removeMemberController,
} from "@/controllers/subcontractors.controller.js";
import {
	editMemberBodySchema,
	memberBodySchema,
	listSubcontractorsQuerySchema,
	renameSubcontractorBodySchema,
	createSubcontractorBodySchema,
	subcontractorParametersSchema,
	memberParametersSchema,
} from "@/schemas/subcontractors.schema.js";

export const subcontractorsRouter: Router = Router();
subcontractorsRouter.use(requireAuth);
subcontractorsRouter.get(
	"/",
	validate({ query: listSubcontractorsQuerySchema }),
	listSubcontractorsController
);

subcontractorsRouter.get(
	"/:id",
	validate({ params: subcontractorParametersSchema }),
	getSubcontractorController
);

subcontractorsRouter.delete(
	"/:id",
	validate({ params: subcontractorParametersSchema }),
	deleteSubcontractorController
);

subcontractorsRouter.delete(
	"/:id/members/:memberId",
	validate({ params: memberParametersSchema }),
	removeMemberController
);

subcontractorsRouter.post(
	"/",
	validate({ body: createSubcontractorBodySchema }),
	createSubcontractorController
);

subcontractorsRouter.patch(
	"/:id",
	validate({
		params: subcontractorParametersSchema,
		body: renameSubcontractorBodySchema,
	}),
	renameSubcontractorController
);

subcontractorsRouter.post(
	"/:id/members",
	validate({ params: subcontractorParametersSchema, body: memberBodySchema }),
	addMemberController
);

subcontractorsRouter.patch(
	"/:id/members/:memberId",
	validate({ params: memberParametersSchema, body: editMemberBodySchema }),
	editMemberController
);
