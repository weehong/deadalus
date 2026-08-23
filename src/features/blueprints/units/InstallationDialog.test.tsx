import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/common/i18n";
import { InstallationDialog } from "./InstallationDialog";

describe("InstallationDialog", () => {
	it("prefills edit values and submits changes", async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		render(
			<InstallationDialog
				isOpen
				initialValues={{
					assetTag: "AHU-1",
					equipment: "AHU",
					installedDate: "2026-01-01",
					location: "Roof",
					model: "X1",
					state: "live",
				}}
				onClose={vi.fn()}
				onSubmit={submit}
			/>
		);
		const equipment = screen.getByRole("textbox", { name: "Equipment" });
		expect((equipment as HTMLInputElement).value).toBe("AHU");
		await user.clear(equipment);
		await user.type(equipment, "Air handler");
		await user.click(screen.getByRole("button", { name: "Save" }));
		expect(submit).toHaveBeenCalledWith(
			expect.objectContaining({
				assetTag: "AHU-1",
				equipment: "Air handler",
				state: "live",
			})
		);
	});
});
