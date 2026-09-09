import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabelRow } from "./LabelRow";

describe("LabelRow", () => {
	it("renders one item per label in order", () => {
		render(<LabelRow labels={["Projects", "Blocks", "Storeys", "Units"]} />);
		const items = screen.getAllByRole("listitem");
		expect(items.map((item) => item.textContent)).toEqual([
			"Projects",
			"Blocks",
			"Storeys",
			"Units",
		]);
	});
});
