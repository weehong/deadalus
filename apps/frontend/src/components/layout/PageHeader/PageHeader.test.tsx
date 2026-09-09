import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
	it("renders the kicker, a level-one heading and the actions", () => {
		render(
			<PageHeader
				actions={<button type="button">New project</button>}
				heading="Projects"
				kicker="Portfolio"
			/>
		);
		expect(screen.getByRole("banner")).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"Projects"
		);
		expect(screen.getByText("Portfolio")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "New project" })
		).toBeInTheDocument();
	});

	it("omits the kicker and actions when not supplied", () => {
		render(<PageHeader heading="Projects" />);
		expect(screen.queryByText("Portfolio")).not.toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
