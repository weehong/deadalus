import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConsoleShell } from "./ConsoleShell";

const renderShell = (pathname = "/projects"): ReturnType<typeof render> =>
	render(
		<ConsoleShell
			closeMenuLabel="Close menu"
			openMenuLabel="Menu"
			pathname={pathname}
			sidebar={<a href="/projects">Projects</a>}
			sidebarLabel="Sidebar"
		>
			Content
		</ConsoleShell>
	);

describe("ConsoleShell", () => {
	it("places the sidebar in a complementary landmark and the content in main", () => {
		renderShell();
		expect(
			screen.getByRole("complementary", { name: "Sidebar" })
		).toContainElement(screen.getByRole("link", { name: "Projects" }));
		expect(screen.getAllByRole("main")).toHaveLength(1);
		expect(screen.getAllByRole("complementary")).toHaveLength(1);
		expect(screen.getByRole("main")).toHaveTextContent("Content");
	});

	it("starts closed, with the toggle wired to the sidebar", () => {
		renderShell();
		const toggle = screen.getByRole("button", { name: "Menu" });
		const sidebar = screen.getByRole("complementary");
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(toggle).toHaveAttribute("aria-controls", sidebar.id);
		expect(sidebar).toHaveAttribute("data-state", "closed");
		expect(toggle).not.toHaveFocus();
	});

	it("opens on the toggle, focuses the drawer, and closes on Escape", async () => {
		const user = userEvent.setup();
		renderShell();
		await user.click(screen.getByRole("button", { name: "Menu" }));
		const sidebar = screen.getByRole("complementary");
		expect(sidebar).toHaveAttribute("data-state", "open");
		expect(sidebar).toHaveFocus();
		expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
			"aria-expanded",
			"true"
		);

		await user.tab();
		expect(screen.getByRole("link", { name: "Projects" })).toHaveFocus();
		await user.keyboard("{Escape}");
		expect(sidebar).toHaveAttribute("data-state", "closed");
		expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
	});

	it("closes on the toggle again", async () => {
		const user = userEvent.setup();
		renderShell();
		await user.click(screen.getByRole("button", { name: "Menu" }));
		await user.click(screen.getByRole("button", { name: "Close menu" }));
		expect(screen.getByRole("complementary")).toHaveAttribute(
			"data-state",
			"closed"
		);
		expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
	});

	it("closes when the route changes and returns focus to the toggle", async () => {
		const user = userEvent.setup();
		const view = renderShell("/projects");
		await user.click(screen.getByRole("button", { name: "Menu" }));
		expect(screen.getByRole("complementary")).toHaveAttribute(
			"data-state",
			"open"
		);
		view.rerender(
			<ConsoleShell
				closeMenuLabel="Close menu"
				openMenuLabel="Menu"
				pathname="/subcontractors"
				sidebar={<a href="/projects">Projects</a>}
				sidebarLabel="Sidebar"
			>
				Content
			</ConsoleShell>
		);
		expect(screen.getByRole("complementary")).toHaveAttribute(
			"data-state",
			"closed"
		);
		expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
	});

	it("keeps an open drawer when the same route renders again", async () => {
		const user = userEvent.setup();
		const view = renderShell();
		await user.click(screen.getByRole("button", { name: "Menu" }));
		view.rerender(
			<ConsoleShell
				closeMenuLabel="Close menu"
				openMenuLabel="Menu"
				pathname="/projects"
				sidebar={<a href="/projects">Projects</a>}
				sidebarLabel="Sidebar"
			>
				Updated content
			</ConsoleShell>
		);
		expect(screen.getByRole("complementary")).toHaveAttribute(
			"data-state",
			"open"
		);
		expect(screen.getByRole("complementary")).toHaveFocus();
	});

	it("does not move focus when navigating with the drawer already closed", async () => {
		const user = userEvent.setup();
		const view = renderShell();
		await user.click(screen.getByRole("main"));
		view.rerender(
			<ConsoleShell
				closeMenuLabel="Close menu"
				openMenuLabel="Menu"
				pathname="/subcontractors"
				sidebar={<a href="/projects">Projects</a>}
				sidebarLabel="Sidebar"
			>
				Content
			</ConsoleShell>
		);
		expect(screen.getByRole("button", { name: "Menu" })).not.toHaveFocus();
	});

	it("closes on the pointer-only backdrop and returns focus to the toggle", async () => {
		const user = userEvent.setup();
		renderShell();
		await user.click(screen.getByRole("button", { name: "Menu" }));
		const backdrop = screen.getByTestId("console-backdrop");
		expect(backdrop).toHaveAttribute("aria-hidden", "true");
		expect(backdrop).not.toHaveAttribute("tabindex");
		await user.click(backdrop);
		expect(screen.getByRole("complementary")).toHaveAttribute(
			"data-state",
			"closed"
		);
		expect(screen.queryByTestId("console-backdrop")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
	});
});
