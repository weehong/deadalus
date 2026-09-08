import { describe, expect, it } from "vitest";

import { getHealth } from "@/services/health.service.js";

describe("getHealth", () => {
	it("reports an ok status with runtime metadata", () => {
		const health = getHealth();

		expect(health.status).toBe("ok");
		expect(health.uptime).toBeGreaterThanOrEqual(0);
		expect(typeof health.version).toBe("string");
		expect(() => new Date(health.timestamp).toISOString()).not.toThrow();
	});
});
