import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `env.ts` validates `process.env` at import and exits the process on failure,
 * so each case re-imports a fresh module with `process.exit` and `stderr`
 * captured.
 */
async function importEnvironment(): Promise<{
	exitCode: number | string | null | undefined;
	stderr: string;
}> {
	vi.resetModules();
	let stderr = "";
	let exitCode: number | string | null | undefined;
	vi.spyOn(process, "exit").mockImplementation((code) => {
		exitCode = code;
		throw new Error(`process.exit(${String(code)})`);
	});
	vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
		stderr += String(chunk);
		return true;
	});
	await import("@/config/env.js").catch(() => undefined);
	return { exitCode, stderr };
}

describe("environment validation", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("boots with the test setup's MEMBER_TOKEN_SECRET", async () => {
		const { exitCode } = await importEnvironment();
		expect(exitCode).toBeUndefined();
	});

	it("fails fast without MEMBER_TOKEN_SECRET", async () => {
		vi.stubEnv("MEMBER_TOKEN_SECRET", undefined);
		const { exitCode, stderr } = await importEnvironment();
		expect(exitCode).toBe(1);
		expect(stderr).toContain("MEMBER_TOKEN_SECRET");
	});

	it("fails fast when MEMBER_TOKEN_SECRET is shorter than 32 characters", async () => {
		vi.stubEnv("MEMBER_TOKEN_SECRET", "too-short");
		const { exitCode, stderr } = await importEnvironment();
		expect(exitCode).toBe(1);
		expect(stderr).toContain("MEMBER_TOKEN_SECRET");
	});
});
