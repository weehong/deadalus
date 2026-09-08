import { z } from "@/lib/zod.js";

/**
 * Request body for `POST /api/v1/matches`. Only the team names are required:
 * the frontend form collects just those two, and the service defaults the rest.
 * Unknown keys are stripped by the `validate` middleware, which replaces
 * `req.body` with the parse result.
 */
export const createMatchBodySchema = z.object({
	homeTeam: z.string().trim().min(1, "Home team is required"),
	awayTeam: z.string().trim().min(1, "Away team is required"),
	homeScore: z.coerce.number().int().min(0).optional(),
	awayScore: z.coerce.number().int().min(0).optional(),
	playedOn: z.string().datetime().optional(),
});

export type CreateMatchBody = z.infer<typeof createMatchBodySchema>;
