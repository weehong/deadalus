import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SplitLayout } from "./SplitLayout";

describe("SplitLayout", () => {
	it("renders generic aside and main content in document order", () => {
		render(<SplitLayout aside={<p>Identity</p>}><button type="button">Continue</button></SplitLayout>);
		expect(within(screen.getByRole("complementary")).getByText("Identity")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
	});
});
