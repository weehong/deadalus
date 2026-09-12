import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { QrLabel } from "@/features/projects/QrLabel";

const URL = "https://console.example.com/field/units/unit-12-114";

it("shows the Unit's full label over its Project code and Block, and encodes the Unit's Field URL", () => {
	render(<QrLabel blockName="A" label="#12-114" projectCode="EG2" url={URL} />);
	expect(screen.getByText("#12-114")).toBeInTheDocument();
	expect(screen.getByText("EG2 · Block A")).toBeInTheDocument();
	const code = screen.getByRole("img", { name: "#12-114" });
	expect(code).toHaveAttribute("data-qr-url", URL);
	// The viewBox opens four modules before the code and runs four past it: the
	// quiet zone a scanner needs, inside the label's 30mm box.
	const [left, top, width, height] = (
		code.getAttribute("viewBox") ?? ""
	).split(" ");
	expect([left, top]).toEqual(["-4", "-4"]);
	expect(width).toBe(height);
	expect(Number(width)).toBeGreaterThanOrEqual(21 + 8);
});

it("clips both lines rather than wrapping them, so a long manual name cannot break the grid", () => {
	render(
		<QrLabel
			blockName="Podium Level"
			label="#Podium Level-Shop 1"
			projectCode="EG2"
			url={URL}
		/>
	);
	for (const text of ["#Podium Level-Shop 1", "EG2 · Block Podium Level"])
		expect(screen.getByText(text)).toHaveClass(
			"overflow-hidden",
			"whitespace-nowrap"
		);
});
