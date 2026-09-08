import { z } from "zod";

/**
 * Fallback connection string for local development/test only. Production must
 * supply its own `DATABASE_URL` (enforced below) so the app never silently
 * connects to a throwaway local database.
 */
const LOCAL_DATABASE_URL =
	"postgresql://postgres:postgres@localhost:5432/express_api?schema=public";

/**
 * Schema for every environment variable the app consumes. Coercions live here so
 * the rest of the codebase works with typed, validated values instead of raw
 * strings.
 */
const EnvSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().int().positive().default(3000),
	LOG_LEVEL: z
		.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
		.default("info"),
	CORS_ORIGIN: z.string().default("*"),
	RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
	RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
	// Whether to trust `x-forwarded-*` headers (client IP + protocol). Enable
	// only when running behind a known reverse proxy / load balancer; trusting
	// these headers when directly exposed lets clients spoof their IP.
	TRUST_PROXY: z
		.enum(["true", "false"])
		.default("false")
		.transform((value) => value === "true"),
	DATABASE_URL: z.string().url().optional(),
});

/**
 * Require `DATABASE_URL` in production but fall back to a local instance in
 * development/test. Done as a transform (rather than a field `.default`) so we
 * can tell whether the value was actually supplied before defaulting it.
 */
const ConfiguredEnvSchema = EnvSchema.transform((config, context) => {
	if (config.DATABASE_URL) {
		return { ...config, DATABASE_URL: config.DATABASE_URL };
	}

	if (config.NODE_ENV === "production") {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["DATABASE_URL"],
			message: "DATABASE_URL is required in production",
		});
		return z.NEVER;
	}

	return { ...config, DATABASE_URL: LOCAL_DATABASE_URL };
});

export type Env = z.infer<typeof ConfiguredEnvSchema>;

const parsed = ConfiguredEnvSchema.safeParse(process.env);

if (!parsed.success) {
	// Fail fast: a misconfigured environment should never boot a half-working
	// server. Use the bare console here because the logger itself depends on a
	// valid `LOG_LEVEL`.
	const issues = parsed.error.issues
		.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
		.join("\n");
	process.stderr.write(`Invalid environment variables:\n${issues}\n`);
	process.exit(1);
}

/** Validated, immutable application configuration. */
export const env: Readonly<Env> = Object.freeze(parsed.data);

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const isDevelopment = env.NODE_ENV === "development";
