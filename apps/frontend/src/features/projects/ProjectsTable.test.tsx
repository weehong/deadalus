import { withRouter } from "@/testing/withRouter";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProjectsTable } from "@/features/projects/ProjectsTable";
describe("Projects table", () => {
	it("shows Project codes, names, descendant counts and Progression with page controls", async () => {
		const onPageChange = vi.fn();
		render(
			withRouter(
				<ProjectsTable
					meta={{ page: 1, pageSize: 20, total: 21 }}
					data={[
						{
							id: "eg2",
							name: "Evergreen Gardens",
							code: "EG2",
							blockCount: 2,
							storeyCount: 4,
							unitCount: 8,
							itemCount: 16,
							progression: 62.5,
						},
						{
							id: "klw",
							name: "Kings Lane",
							code: "KLW",
							blockCount: 0,
							storeyCount: 0,
							unitCount: 0,
							itemCount: 0,
							progression: null,
						},
					]}
					onPageChange={onPageChange}
				/>
			)
		);
		expect(await screen.findByRole("table")).toBeVisible();
		for (const name of [
			"Code",
			"Project",
			"Blocks",
			"Storeys",
			"Units",
			"Progression",
		])
			expect(screen.getByRole("columnheader", { name })).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Evergreen Gardens" })
		).toHaveAttribute("href", "/projects/eg2");
		for (const name of ["EG2", "Evergreen Gardens", "2", "4", "8", "63%"])
			expect(screen.getByRole("cell", { name })).toBeVisible();
		expect(screen.getByRole("row", { name: /Kings Lane/ })).toHaveTextContent(
			"No Items"
		);
		expect(
			screen.getByRole("row", { name: /Kings Lane/ })
		).not.toHaveTextContent("%");
		expect(screen.getByText("Page 1 of 2 · 21 projects")).toBeVisible();
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		await userEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(onPageChange).toHaveBeenCalledWith(2);
	});
	it("disables Next on the last page and allows Previous", async () => {
		const onPageChange = vi.fn();
		render(
			withRouter(
				<ProjectsTable
					data={[]}
					meta={{ page: 2, pageSize: 20, total: 21 }}
					onPageChange={onPageChange}
				/>
			)
		);
		expect(await screen.findByRole("button", { name: "Next" })).toBeDisabled();
		await userEvent.click(screen.getByRole("button", { name: "Previous" }));
		expect(onPageChange).toHaveBeenCalledWith(1);
	});
});
