import { Router } from "express";

import { fieldRouter } from "@/routes/field.route.js";
import { healthRouter } from "@/routes/health.route.js";
import { matchesRouter } from "@/routes/matches.route.js";
import { meRouter } from "@/routes/me.route.js";
import { subcontractorsRouter } from "@/routes/subcontractors.route.js";
import { projectsRouter } from "@/routes/projects.route.js";

/**
 * Root application router. Health/readiness probes live at the top level;
 * versioned feature routes mount under `/api/v1`.
 */
export const apiRouter: Router = Router();

apiRouter.use(healthRouter);

const v1Router: Router = Router();
v1Router.use("/matches", matchesRouter);
v1Router.use("/me", meRouter);
v1Router.use("/subcontractors", subcontractorsRouter);
v1Router.use("/projects", projectsRouter);
v1Router.use("/field", fieldRouter);
apiRouter.use("/api/v1", v1Router);
