import { Router } from "express";

import { healthRouter } from "@/routes/health.route.js";
import { matchesRouter } from "@/routes/matches.route.js";

/**
 * Root application router. Health/readiness probes live at the top level;
 * versioned feature routes mount under `/api/v1`.
 */
export const apiRouter: Router = Router();

apiRouter.use(healthRouter);

const v1Router: Router = Router();
v1Router.use("/matches", matchesRouter);
apiRouter.use("/api/v1", v1Router);
