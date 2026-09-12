import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CatalogueItemsTable } from "@/features/projects/CatalogueItemsTable";
it("lists each Catalogue Item with how many Units hold it", () => {
	render(
		<CatalogueItemsTable
			catalogueItems={[
				{ id: "cabinet", name: "Kitchen cabinet", itemCount: 240 },
			]}
		/>
	);
	for (const name of ["Item", "Units"])
		expect(screen.getByRole("columnheader", { name })).toBeVisible();
	expect(screen.getByRole("cell", { name: "Kitchen cabinet" })).toBeVisible();
	expect(screen.getByRole("cell", { name: "240" })).toBeVisible();
	expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
});
it("explains how to start an empty Item Catalogue", () => {
	render(<CatalogueItemsTable catalogueItems={[]} />);
	expect(
		screen.getByText(
			"No Items yet. Add a Catalogue Item to build the Item Catalogue."
		)
	).toBeVisible();
});
it("renders an editor directly below its row and an add form below the catalogue", () => {
	render(
		<CatalogueItemsTable
			catalogueItems={[{ id: "cabinet", name: "Wardrobe", itemCount: 2 }]}
			footer={<form aria-label="Add Catalogue Item" />}
			renderActions={() => <button>Rename Catalogue Item</button>}
			renderEditor={() => <form aria-label="Rename Catalogue Item" />}
		/>
	);
	expect(screen.getByRole("columnheader", { name: "Actions" })).toBeVisible();
	expect(
		screen.getByRole("form", { name: "Rename Catalogue Item" })
	).toBeVisible();
	expect(
		screen.getByRole("form", { name: "Add Catalogue Item" })
	).toBeVisible();
	expect(screen.getByRole("cell", { name: "2" })).toBeVisible();
});
