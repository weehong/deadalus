import {
	addUnitsController,
	editUnitController,
	deleteUnitController,
} from "@/controllers/units.controller.js";
import {
	addUnitsBodySchema,
	editUnitBodySchema,
	unitParametersSchema,
} from "@/schemas/units.schema.js";
import {
	commitStructureController,
	parseStructureBody,
} from "@/controllers/commit-structure.controller.js";
import { commitStructureBodySchema } from "@/schemas/commit-structure.schema.js";
import {
	addStoreysController,
	renameStoreyController,
	deleteStoreyController,
} from "@/controllers/storeys.controller.js";
import { parseUnitMatrixController } from "@/controllers/unit-matrix.controller.js";
import {
	addStoreysBodySchema,
	renameStoreyBodySchema,
	storeyParametersSchema,
	addBlocksBodySchema,
	renameBlockBodySchema,
	blockParametersSchema,
} from "@/schemas/structure.schema.js";
import {
	addBlocksController,
	renameBlockController,
	deleteBlockController,
} from "@/controllers/blocks.controller.js";
import { projectParametersSchema } from "@/schemas/project-detail.schema.js";
import { Router } from "express";
import { requireAuth } from "@/middlewares/require-auth.js";
import { validate } from "@/middlewares/validate.js";
import {
	listProjectsController,
	addUnitTypeController,
	editUnitTypeController,
	deleteUnitTypeController,
	createProjectController,
	readProjectController,
	editProjectController,
	deleteProjectController,
} from "@/controllers/projects.controller.js";
import {
	listProjectsQuerySchema,
	createProjectBodySchema,
	addUnitTypeBodySchema,
	editUnitTypeBodySchema,
	unitTypeParametersSchema,
	editProjectBodySchema,
} from "@/schemas/projects.schema.js";
export const projectsRouter: Router = Router();
projectsRouter.use(requireAuth);
projectsRouter.get(
	"/",
	validate({ query: listProjectsQuerySchema }),
	listProjectsController
);

projectsRouter.post(
	"/",
	validate({ body: createProjectBodySchema }),
	createProjectController
);

projectsRouter.get(
	"/:id",
	validate({ params: projectParametersSchema }),
	readProjectController
);

projectsRouter.patch(
	"/:id",
	validate({ params: projectParametersSchema, body: editProjectBodySchema }),
	editProjectController
);

projectsRouter.delete(
	"/:id",
	validate({ params: projectParametersSchema }),
	deleteProjectController
);

projectsRouter.post(
	"/:id/blocks",
	validate({ params: projectParametersSchema, body: addBlocksBodySchema }),
	addBlocksController
);
projectsRouter.patch(
	"/:id/blocks/:blockId",
	validate({ params: blockParametersSchema, body: renameBlockBodySchema }),
	renameBlockController
);
projectsRouter.delete(
	"/:id/blocks/:blockId",
	validate({ params: blockParametersSchema }),
	deleteBlockController
);

projectsRouter.post(
	"/:id/unit-matrix/parse",
	validate({ params: projectParametersSchema }),
	parseUnitMatrixController
);

projectsRouter.post(
	"/:id/unit-types",
	validate({ params: projectParametersSchema, body: addUnitTypeBodySchema }),
	addUnitTypeController
);
projectsRouter.patch(
	"/:id/unit-types/:unitTypeId",
	validate({ params: unitTypeParametersSchema, body: editUnitTypeBodySchema }),
	editUnitTypeController
);
projectsRouter.delete(
	"/:id/unit-types/:unitTypeId",
	validate({ params: unitTypeParametersSchema }),
	deleteUnitTypeController
);

projectsRouter.post(
	"/:id/blocks/:blockId/storeys",
	validate({ params: blockParametersSchema, body: addStoreysBodySchema }),
	addStoreysController
);
projectsRouter.patch(
	"/:id/storeys/:storeyId",
	validate({ params: storeyParametersSchema, body: renameStoreyBodySchema }),
	renameStoreyController
);
projectsRouter.delete(
	"/:id/storeys/:storeyId",
	validate({ params: storeyParametersSchema }),
	deleteStoreyController
);

projectsRouter.post(
	"/:id/structure",
	parseStructureBody,
	validate({
		params: projectParametersSchema,
		body: commitStructureBodySchema,
	}),
	commitStructureController
);

projectsRouter.post(
	"/:id/blocks/:blockId/units",
	validate({ params: blockParametersSchema, body: addUnitsBodySchema }),
	addUnitsController
);
projectsRouter.patch(
	"/:id/units/:unitId",
	validate({ params: unitParametersSchema, body: editUnitBodySchema }),
	editUnitController
);
projectsRouter.delete(
	"/:id/units/:unitId",
	validate({ params: unitParametersSchema }),
	deleteUnitController
);
