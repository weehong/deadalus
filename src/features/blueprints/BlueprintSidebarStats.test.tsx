/* eslint-disable camelcase -- provider-shaped fixtures */
import { render, screen } from "@testing-library/react";
import "@/common/i18n";
import { describe, expect, it, vi } from "vitest";
vi.mock("./data/hooks", () => ({
	useSitesQuery: () => ({ data: [{ id: "site" }] }),
	drawingHooks: {
		useList: () => ({
			data: [
				{ id: "a", size_bytes: 1_048_576 },
				{ id: "b", size_bytes: 524_288 },
			],
		}),
	},
}));
import { BlueprintSidebarStats } from "./BlueprintSidebarStats";
describe("BlueprintSidebarStats", () => {
	it("shows drawing count and combined size", () => {
		render(<BlueprintSidebarStats />);
		expect(screen.getByText("2 drawings")).toBeTruthy();
		expect(screen.getByText("1.5 MB total")).toBeTruthy();
	});
});
