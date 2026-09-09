/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any -- mirrors jest-dom's own vitest augmentation, which pnpm resolves against the wrong vitest copy. */
// jest-dom matcher types on vitest's `expect`, for test files under src/.
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import "vitest";

declare module "vitest" {
	interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
	interface AsymmetricMatchersContaining
		extends TestingLibraryMatchers<any, any> {}
}
