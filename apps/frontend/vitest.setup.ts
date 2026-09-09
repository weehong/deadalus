import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
// Real translations in every test, so assertions use the copy an Administrator sees.
import "@/common/i18n";

// Extend THIS workspace's `expect`. The `@testing-library/jest-dom/vitest`
// entry would resolve `vitest` through the pnpm store and land on the
// backend's vitest 2, leaving the frontend's vitest 4 without the matchers.
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
	cleanup();
});
