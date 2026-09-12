import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/common/api";
import type { ProgressEntry, UnitItem } from "@/common/items";
import {
	ProgressEntryPanel,
	type ProgressHistoryRead,
} from "./ProgressEntryPanel";

const wardrobe: UnitItem = {
	id: "i1",
	catalogueItemId: "wardrobe",
	name: "Wardrobe",
	subcontractor: { id: "acme", name: "Acme Joinery" },
	assignedAt: "2026-09-01T00:00:00.000Z",
	progression: 60,
	latestEntry: null,
};
const entries: Array<ProgressEntry> = [
	{
		id: "e1",
		value: 60,
		note: null,
		enteredByKind: "member",
		enteredByName: "Alex Tan",
		subcontractorName: "Acme Joinery",
		createdAt: "2026-09-09T12:00:00.000Z",
	},
];
const idle: ProgressHistoryRead = {
	isLoading: false,
	isError: false,
	refetch: vi.fn(),
};

describe("ProgressEntryPanel", () => {
	it("enters progress through the hook it is given and reads the history only once the disclosure opens", async () => {
		const user = userEvent.setup();
		const onEnter = vi.fn((): Promise<void> => Promise.resolve());
		const useHistory = vi.fn(
			(_itemId: string, enabled: boolean): ProgressHistoryRead =>
				enabled ? { ...idle, data: entries } : idle
		);
		render(
			<ProgressEntryPanel
				item={wardrobe}
				useHistory={useHistory}
				onEnter={onEnter}
			/>
		);
		expect(useHistory).toHaveBeenLastCalledWith("i1", false);
		const form = screen.getByRole("form", {
			name: "Enter progress for Wardrobe",
		});
		await user.type(
			within(form).getByLabelText("Progression (0 to 100)"),
			"75"
		);
		await user.click(within(form).getByRole("button", { name: "Enter" }));
		expect(onEnter).toHaveBeenCalledWith("i1", { value: 75 });
		expect(screen.queryByRole("list")).toBeNull();
		await user.click(screen.getByRole("button", { name: "History" }));
		expect(useHistory).toHaveBeenLastCalledWith("i1", true);
		expect(
			within(
				screen.getByRole("list", { name: "History for Wardrobe" })
			).getAllByRole("listitem")
		).toHaveLength(1);
	});

	it("puts the API's refusal on the form, a failed history read behind Retry, and sizes the controls as asked", async () => {
		const user = userEvent.setup();
		const refetch = vi.fn();
		render(
			<ProgressEntryPanel
				buttonClassName="h-[44px]"
				controlClassName="h-[44px] text-base"
				item={wardrobe}
				useHistory={(): ProgressHistoryRead => ({
					isLoading: false,
					isError: true,
					refetch,
				})}
				onEnter={(): Promise<void> =>
					Promise.reject(
						new ApiRequestError(409, "No Assignment", "ITEM_UNASSIGNED")
					)
				}
			/>
		);
		const value = screen.getByLabelText("Progression (0 to 100)");
		expect(value).toHaveClass("h-[44px]");
		await user.type(value, "50");
		await user.click(screen.getByRole("button", { name: "Enter" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"This Item has no Assignment. Assign it first."
		);
		const history = screen.getByRole("button", { name: "History" });
		expect(history).toHaveClass("h-[44px]");
		await user.click(history);
		expect(
			screen.getByText("Could not load the history. Try again.")
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Retry" }));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it("disables the form on an Item with no Assignment", () => {
		render(
			<ProgressEntryPanel
				item={{ ...wardrobe, subcontractor: null, assignedAt: null }}
				useHistory={(): ProgressHistoryRead => idle}
				onEnter={vi.fn()}
			/>
		);
		expect(
			screen.getByText(
				"Assign this Item to a Subcontractor before entering progress."
			)
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Enter" })).toBeDisabled();
	});
});
