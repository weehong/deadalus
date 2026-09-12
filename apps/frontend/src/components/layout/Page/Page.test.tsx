import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "@/components/layout/PageHeader";
import { Page } from "./Page";

describe("Page", () => {
	it("renders its content and accepts extra classes", () => {
		render(<Page className="extra">Content</Page>);
		const page = screen.getByText("Content");
		expect(page).toHaveClass("extra");
		expect(page).toHaveClass("max-w-[1400px]");
	});

	it("composes a screen inside the shell's single main landmark", () => {
		render(
			<main>
				<Page>
					<PageHeader heading="Projects" kicker="Portfolio" />
					<p>Project content</p>
				</Page>
			</main>
		);

		expect(screen.getAllByRole("main")).toHaveLength(1);
		expect(screen.getByRole("main")).toContainElement(
			screen.getByRole("heading", { level: 1, name: "Projects" })
		);
		expect(screen.getByText("Project content")).toBeVisible();
	});
});
