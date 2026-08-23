import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FigureGrid } from "./FigureGrid";

describe("FigureGrid", () => {
	it("renders every supplied figure as a value and label", () => {
		render(<FigureGrid figures={[{ label: "Sites", value: "12" }, { label: "Assets", value: "2.4k" }, { label: "Coverage", value: "24/7" }, { label: "Regions", value: "4" }]} />);
		expect(screen.getAllByRole("term")).toHaveLength(4);
		expect(screen.getAllByRole("definition")).toHaveLength(4);
		expect(screen.getByText("2.4k")).toBeTruthy();
	});
});
