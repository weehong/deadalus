import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { PageHeading } from "./PageHeading";
import { Table } from "./Table";
import { Tag } from "./Tag";

describe("Blueprint primitives", () => {
	it("composes title, context and actions in the page heading", () => {
		render(
			<PageHeading
				actions={<button>New unit</button>}
				context="North Point"
				title="Units"
			/>
		);
		expect(screen.getByRole("heading", { name: "Units" })).toBeTruthy();
		expect(screen.getByText("North Point")).toBeTruthy();
		expect(screen.getByRole("button", { name: "New unit" })).toBeTruthy();
	});
	it.each(["neutral", "positive", "warning"] as const)(
		"renders the %s tag tone",
		(tone) => {
			render(<Tag tone={tone}>{tone}</Tag>);
			expect(screen.getByText(tone).className).toBeTruthy();
		}
	);
	it("renders a semantic table", () => {
		render(
			<Table>
				<caption>Units</caption>
				<tbody>
					<tr>
						<td>01-A</td>
					</tr>
				</tbody>
			</Table>
		);
		expect(screen.getByRole("table", { name: "Units" })).toBeTruthy();
	});
	it("names the item and confirms when allowed", () => {
		const confirm = vi.fn();
		render(
			<ConfirmDialog
				open
				itemName="Ground floor"
				title="Delete storey"
				onClose={vi.fn()}
				onConfirm={confirm}
			/>
		);
		expect(screen.getByText("Ground floor")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(confirm).toHaveBeenCalledOnce();
	});
	it("disables confirmation and explains a blocked deletion", () => {
		const confirm = vi.fn();
		render(
			<ConfirmDialog
				open
				blockedReason="Remove its floor plans first."
				itemName="Ground floor"
				title="Delete storey"
				onClose={vi.fn()}
				onConfirm={confirm}
			/>
		);
		expect(screen.getByRole("status").textContent).toContain("floor plans");
		expect(
			screen.getByRole<HTMLButtonElement>("button", { name: "Delete" }).disabled
		).toBe(true);
	});
});
