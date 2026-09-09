import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountBlock, initialsFor } from ".";

describe("initialsFor", () => {
	it("takes the first letter of the first two words of the local part", () => {
		expect(initialsFor("r.okonkwo@unitmatrix.co")).toBe("RO");
		expect(initialsFor("vernon_koh@example.com")).toBe("VK");
	});

	it("takes the first two letters when the local part is one word", () => {
		expect(initialsFor("vernon@example.com")).toBe("VE");
		expect(initialsFor("+vernon@example.com")).toBe("VE");
	});

	it("is empty for an empty email", () => {
		expect(initialsFor("")).toBe("");
	});
});

describe("AccountBlock", () => {
	it("shows the email and role, with the initials hidden from readers", () => {
		render(
			<AccountBlock email="r.okonkwo@unitmatrix.co" role="Administrator" />
		);
		expect(screen.getByText("r.okonkwo@unitmatrix.co")).toBeInTheDocument();
		expect(screen.getByText("Administrator")).toBeInTheDocument();
		expect(screen.getByText("RO")).toHaveAttribute("aria-hidden", "true");
	});

	it("keeps the full email available when its visible text is truncated", () => {
		const email =
			"administrator.with.a.very.long.name@construction-company.example";
		render(<AccountBlock email={email} role="Administrator" />);
		const address = screen.getByText(email);
		expect(address).toHaveAttribute("title", email);
		expect(address).toHaveClass("truncate");
	});
});
