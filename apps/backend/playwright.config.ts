import { defineConfig } from "@playwright/test";

/**
 * E2E tests hit the built server over HTTP and assert on JSON responses, so a
 * single API project using the `request` fixture is enough — no browser engines.
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./e2e",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env["CI"],
	/* Retry on CI only */
	retries: process.env["CI"] ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env["CI"] ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "html",
	/* Shared settings for all the projects below. */
	use: {
		/* Base URL to use in actions like `await request.get('/health')`. */
		baseURL: "http://localhost:3000",
		/* Collect trace when retrying the failed test. */
		trace: "on-first-retry",
	},

	/* JSON API — no browser engines required. */
	projects: [
		{
			name: "api",
		},
	],

	/* Build then run the production server before starting the tests. */
	webServer: {
		command: "pnpm run build && pnpm run start",
		url: "http://localhost:3000/health",
		reuseExistingServer: !process.env["CI"],
		timeout: 120 * 1000,
	},
});
