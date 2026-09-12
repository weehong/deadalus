import { withRouter } from "@/testing/withRouter";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldBackLink } from "@/features/field/FieldBackLink";

describe("FieldBackLink", () => {
	it("is a thumb-sized link back to the Projects screen", async () => {
		render(
			withRouter(
				<FieldBackLink label="Back to Projects" target={{ to: "projects" }} />
			)
		);
		const link = await screen.findByRole("link", { name: "Back to Projects" });
		expect(link).toHaveAttribute("href", "/field");
		expect(link).toHaveClass("min-h-[44px]");
	});

	it("carries the Block and Storey selection back into the drill-down", async () => {
		render(
			withRouter(
				<FieldBackLink
					label="Back to Units"
					target={{
						to: "project",
						id: "gardens",
						search: { block: "a", storey: "a1" },
					}}
				/>
			)
		);
		expect(
			await screen.findByRole("link", { name: "Back to Units" })
		).toHaveAttribute("href", "/field/projects/gardens?block=a&storey=a1");
	});
});
