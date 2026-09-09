import { Router } from "express";

import { meController } from "@/controllers/me.controller.js";
import { requireAuth } from "@/middlewares/require-auth.js";

export const meRouter: Router = Router();

meRouter.get("/", requireAuth, meController);
