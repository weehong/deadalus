import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UnitTypesTable } from "@/features/projects/UnitTypesTable";
it("renders the catalogue as a table with code, description and Unit counts", () => {
	render(
		<UnitTypesTable
			unitTypes={[
				{ id: "as1", code: "AS1", description: "1 Bedroom", unitCount: 8 },
			]}
		/>
	);
	for (const name of ["Code", "Description", "Units"])
		expect(screen.getByRole("columnheader", { name })).toBeVisible();
	expect(screen.getByRole("cell", { name: "1 Bedroom" })).toBeVisible();
	expect(screen.getByRole("cell", { name: "8" })).toBeVisible();
});
it("explains how to start an empty catalogue", () => {
	render(<UnitTypesTable unitTypes={[]} />);
	expect(
		screen.getByText(
			"No Unit Types yet. Add a Unit Type to build the catalogue."
		)
	).toBeVisible();
});
it("renders an editor directly below its Unit Type row and an add form below the catalogue", () => {
	render(
		<UnitTypesTable
			footer={<form aria-label="Add Unit Type" />}
			renderActions={() => <button>Edit Unit Type</button>}
			renderEditor={() => <form aria-label="Edit Unit Type" />}
			unitTypes={[{ id: "t1", code: "AS1", description: null, unitCount: 2 }]}
		/>
	);
	expect(screen.getByRole("form", { name: "Edit Unit Type" })).toBeVisible();
	expect(screen.getByRole("form", { name: "Add Unit Type" })).toBeVisible();
	expect(screen.getByRole("cell", { name: "2" })).toBeVisible();
});
