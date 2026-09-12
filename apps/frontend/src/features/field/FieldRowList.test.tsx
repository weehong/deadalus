import { withRouter } from "@/testing/withRouter";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldRowList } from "@/features/field/FieldRowList";

describe("FieldRowList", () => {
	it("renders each Project as one 44px link naming its code, name, Item count and rounded Progression", async () => {
		render(
			withRouter(
				<FieldRowList
					label="Projects"
					rows={[
						{
							id: "aurora",
							code: "AUR",
							name: "Aurora",
							itemCount: 1,
							progression: 0,
							link: { to: "project", id: "aurora" },
						},
						{
							id: "gardens",
							code: "EG2",
							name: "Gardens",
							itemCount: 3,
							progression: 73.4,
							link: { to: "project", id: "gardens" },
						},
					]}
				/>
			)
		);
		const list = await screen.findByRole("list", { name: "Projects" });
		const links = within(list).getAllByRole("link");
		expect(links).toHaveLength(2);

		expect(links[0]).toHaveTextContent("AUR");
		expect(links[0]).toHaveTextContent("Aurora");
		expect(links[0]).toHaveTextContent("1 Item");
		expect(links[0]).not.toHaveTextContent("1 Items");
		expect(links[0]).toHaveTextContent("0%");
		expect(links[0]).toHaveAttribute("href", "/field/projects/aurora");
		expect(links[0]).toHaveClass("min-h-[44px]");

		expect(links[1]).toHaveTextContent("EG2");
		expect(links[1]).toHaveTextContent("3 Items");
		expect(links[1]).toHaveTextContent("73%");
		expect(links[1]).toHaveAttribute("href", "/field/projects/gardens");
	});

	it("carries a Structure selection in the search params and sends a Unit row to its own screen", async () => {
		render(
			withRouter(
				<FieldRowList
					label="Units"
					rows={[
						{
							id: "a",
							name: "A",
							itemCount: 2,
							progression: 60,
							link: { to: "project", id: "gardens", search: { block: "a" } },
						},
						{
							id: "a1",
							name: "01",
							itemCount: 2,
							progression: 60,
							link: {
								to: "project",
								id: "gardens",
								search: { block: "a", storey: "a1" },
							},
						},
						{
							id: "u1",
							name: "01",
							itemCount: 1,
							progression: 80,
							link: { to: "unit", unitId: "u1" },
						},
					]}
				/>
			)
		);
		const links = within(
			await screen.findByRole("list", { name: "Units" })
		).getAllByRole("link");
		expect(links[0]).toHaveAttribute("href", "/field/projects/gardens?block=a");
		expect(links[1]).toHaveAttribute(
			"href",
			"/field/projects/gardens?block=a&storey=a1"
		);
		expect(links[2]).toHaveAttribute("href", "/field/units/u1");
		// A Structure row has no code line.
		expect(links[2]?.querySelectorAll("span")).toHaveLength(4);
	});
});
