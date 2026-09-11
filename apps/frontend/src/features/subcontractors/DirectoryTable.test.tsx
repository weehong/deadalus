import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { withRouter } from "@/testing/withRouter";
import { DirectoryTable } from "./DirectoryTable";

describe("Directory table", () => {
	it("shows Member counts and all stored phones with page navigation", async () => {
		const onPageChange = vi.fn();
		render(
			withRouter(
				<DirectoryTable
					meta={{ page: 1, pageSize: 20, total: 21 }}
					data={[
						{
							id: "acme",
							name: "Acme Fitout",
							memberCount: 2,
							phones: ["+6591234567", "+6592345678"],
						},
					]}
					onPageChange={onPageChange}
				/>
			)
		);
		expect(
			await screen.findByRole("columnheader", { name: "Subcontractor" })
		).toBeVisible();
		expect(screen.getByRole("link", { name: "Acme Fitout" })).toHaveAttribute(
			"href",
			"/subcontractors/acme"
		);
		expect(screen.getByRole("columnheader", { name: "Members" })).toBeVisible();
		expect(screen.getByRole("cell", { name: "2" })).toBeVisible();
		expect(screen.getByText("+6591234567")).toBeVisible();
		expect(screen.getByText("+6592345678")).toBeVisible();
		expect(screen.getByText("Page 1 of 2 · 21 subcontractors")).toBeVisible();
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
		await userEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(onPageChange).toHaveBeenCalledWith(2);
	});
});
