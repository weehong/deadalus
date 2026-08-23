import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/common/i18n";
import { StoreyDialog, UnitDialog } from "./EntityDialogs";

describe("entity dialogs", () => {
	it("pre-fills edit values and submits changed storey values", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(
			<StoreyDialog
				isOpen
				initialValues={{
					name: "Ground",
					number: 0,
					levelFrom: 0,
					levelTo: 4,
					structuralNote: "Transfer slab",
				}}
				onClose={vi.fn()}
				onSubmit={onSubmit}
			/>
		);
		const name = screen.getByRole("textbox", { name: "Name" });
		expect((name as HTMLInputElement).value).toBe("Ground");
		await user.clear(name);
		await user.type(name, "Ground floor");
		await user.click(screen.getByRole("button", { name: "Save" }));
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Ground floor",
				number: 0,
				levelFrom: 0,
				levelTo: 4,
			})
		);
	});

	it("shows validation errors against fields", async () => {
		const user = userEvent.setup();
		render(<UnitDialog isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: "Save" }));
		expect(
			(await screen.findAllByText("This field is required")).length
		).toBeGreaterThan(0);
		expect(
			screen.getByRole("textbox", { name: "Code" }).getAttribute("aria-invalid")
		).toBe("true");
	});

	it("maps a unique provider error onto the code field", async () => {
		const user = userEvent.setup();
		render(
			<UnitDialog
				isOpen
				initialValues={{
					code: "U-1",
					floorPlanId: "p1",
					usableArea: 10,
					entryDoor: "D1",
					roomTags: "101",
					boundaryNote: "",
				}}
				onClose={vi.fn()}
				onSubmit={() => {
					throw Object.assign(new Error("duplicate"), {
						code: "23505",
						constraint: "units_site_id_code_key",
					});
				}}
			/>
		);
		await user.click(screen.getByRole("button", { name: "Save" }));
		expect(
			await screen.findByText("This unit code is already used in this Site.")
		).toBeTruthy();
	});
});
