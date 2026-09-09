import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { NavItem } from "./NavItem";

describe("NavItem", () => {
	it("is a link that reports the current page through aria-current", () => {
		render(
			<NavItem aria-current="page" href="/projects">
				Projects
			</NavItem>
		);
		const link = screen.getByRole("link", { name: "Projects" });
		expect(link).toHaveAttribute("href", "/projects");
		expect(link).toHaveAttribute("aria-current", "page");
	});

	it("leaves other entries unmarked", () => {
		render(<NavItem href="/subcontractors">Subcontractors</NavItem>);
		expect(
			screen.getByRole("link", { name: "Subcontractors" })
		).not.toHaveAttribute("aria-current");
	});

	it("forwards the ref and click handler so a router can control navigation", async () => {
		const user = userEvent.setup();
		const ref = createRef<HTMLAnchorElement>();
		const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
			event.preventDefault();
		});
		render(
			<NavItem ref={ref} href="/projects" onClick={onClick}>
				Projects
			</NavItem>
		);
		const link = screen.getByRole("link", { name: "Projects" });
		expect(ref.current).toBe(link);
		await user.click(link);
		expect(onClick).toHaveBeenCalledOnce();
	});
});
