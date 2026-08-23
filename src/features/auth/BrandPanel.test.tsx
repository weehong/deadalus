import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandPanel } from "./BrandPanel";

describe("BrandPanel", () => {
	it("renders all supplied identity content", () => {
		render(<BrandPanel blurb="Operations overview" figures={[{ label: "Sites", value: "12" }]} headline="Keep moving" kicker="Console" />);
		expect(screen.getByText("Console")).toBeTruthy();
		expect(screen.getByRole("heading", { name: "Keep moving" })).toBeTruthy();
		expect(screen.getByText("Operations overview")).toBeTruthy();
		expect(screen.getByText("12")).toBeTruthy();
		expect(screen.getByText("Sites")).toBeTruthy();
	});
});
