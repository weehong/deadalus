import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandPanel } from "./BrandPanel";

describe("BrandPanel", () => {
	it("renders the supplied copy and hierarchy", () => {
		render(
			<BrandPanel
				blurb="Blurb"
				headline="Headline"
				hierarchy={["Projects", "Blocks", "Storeys", "Units"]}
				kicker="Kicker"
			/>
		);
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"Headline"
		);
		expect(screen.getByText("Kicker")).toBeInTheDocument();
		expect(screen.getByText("Blurb")).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(4);
		expect(screen.getByRole("img", { name: "Daedalus" })).toBeInTheDocument();
	});
});
