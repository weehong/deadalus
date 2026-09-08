import { Router } from "express";

import {
	createMatchController,
	listMatchesController,
} from "@/controllers/matches.controller.js";
import { validate } from "@/middlewares/validate.js";
import { createMatchBodySchema } from "@/schemas/matches.schema.js";

export const matchesRouter: Router = Router();

matchesRouter.get("/", listMatchesController);
matchesRouter.post(
	"/",
	validate({ body: createMatchBodySchema }),
	createMatchController
);
