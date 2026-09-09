import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavItem } from "./NavItem";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
	it("names the navigation landmark and places the brand, entries and foot", () => {
		render(
			<Sidebar
				foot={<button type="button">Sign out</button>}
				label="Console navigation"
				navigation={<NavItem href="/projects">Projects</NavItem>}
				subtitle="Unit Matrix"
			/>
		);
		expect(screen.getByRole("img", { name: "Daedalus" })).toBeInTheDocument();
		expect(screen.getByText("Unit Matrix")).toBeInTheDocument();
		expect(
			screen.getByRole("navigation", { name: "Console navigation" })
		).toContainElement(screen.getByRole("link", { name: "Projects" }));
		expect(
			screen.getByRole("button", { name: "Sign out" })
		).toBeInTheDocument();
	});
});
