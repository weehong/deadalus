// Vitest runs in a Node environment (no jsdom). Pin the runtime to "test" so the
// app and config layers pick safe, deterministic defaults during unit and
// integration runs.
process.env["NODE_ENV"] = "test";
process.env["LOG_LEVEL"] ??= "silent";
// Default to a dedicated test database so unit/integration runs never touch the
// development data. Override via DATABASE_URL when pointing at a real instance.
process.env["DATABASE_URL"] ??=
	"postgresql://postgres:postgres@localhost:5432/express_api_test?schema=public";
