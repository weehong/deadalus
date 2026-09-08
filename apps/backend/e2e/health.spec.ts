import { expect, test } from "@playwright/test";

test("GET /health returns an ok status", async ({ request }) => {
	const response = await request.get("/health");

	expect(response.status()).toBe(200);

	const body = (await response.json()) as { data: { status: string } };
	expect(body.data.status).toBe("ok");
});

test("unknown routes return a 404 JSON error", async ({ request }) => {
	const response = await request.get("/does-not-exist");

	expect(response.status()).toBe(404);

	const body = (await response.json()) as { error: { code: string } };
	expect(body.error.code).toBe("NOT_FOUND");
});
