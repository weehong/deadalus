import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UnitCard } from "@/features/projects/UnitCard";
it("shows the Unit name, its type code and extension actions", () => {
	render(
		<UnitCard
			actions={<button type="button">Edit</button>}
			name="01"
			typeCode="AS1"
		/>
	);
	expect(screen.getByText("01")).toBeVisible();
	expect(screen.getByText("AS1")).toBeVisible();
	expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
});
