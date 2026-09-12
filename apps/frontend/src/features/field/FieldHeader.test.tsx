import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FieldHeader } from "@/features/field/FieldHeader";

describe("FieldHeader", () => {
	it("names the Member and their Subcontractor in a labelled banner", () => {
		render(
			<FieldHeader
				memberName="Alex Tan"
				subcontractorName="Acme Joinery"
				onSignOut={vi.fn()}
			/>
		);
		const banner = screen.getByRole("banner", { name: "Field" });
		expect(banner).toHaveTextContent("Alex Tan");
		expect(banner).toHaveTextContent("Acme Joinery");
	});

	it("offers Sign out as a 44px control that calls back once", async () => {
		const user = userEvent.setup();
		const onSignOut = vi.fn();
		render(
			<FieldHeader
				memberName="Alex Tan"
				subcontractorName="Acme Joinery"
				onSignOut={onSignOut}
			/>
		);
		const signOut = screen.getByRole("button", { name: "Sign out" });
		expect(signOut).toHaveClass("h-[44px]");
		await user.click(signOut);
		expect(onSignOut).toHaveBeenCalledTimes(1);
	});

	it("keeps a long name readable by truncating with the full text on the title", () => {
		const memberName = "A Member With An Unusually Long Registered Name";
		render(
			<FieldHeader
				memberName={memberName}
				subcontractorName="Acme Joinery"
				onSignOut={vi.fn()}
			/>
		);
		const name = screen.getByText(memberName);
		expect(name).toHaveAttribute("title", memberName);
		expect(name).toHaveClass("truncate");
	});
});
