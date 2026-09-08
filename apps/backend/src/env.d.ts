// Type the environment variables this app reads so `process.env.X` dot-access is
// allowed under `noPropertyAccessFromIndexSignature`. These are the *raw*
// (string) values; the validated, coerced, typed config lives in
// `src/config/env.ts`.
declare namespace NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV?: string;
		readonly PORT?: string;
		readonly LOG_LEVEL?: string;
		readonly CORS_ORIGIN?: string;
		readonly RATE_LIMIT_WINDOW_MS?: string;
		readonly RATE_LIMIT_MAX?: string;
		readonly DATABASE_URL?: string;
	}
}
