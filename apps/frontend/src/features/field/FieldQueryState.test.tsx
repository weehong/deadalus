import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/common/api";
import { FieldQueryState } from "@/features/field/FieldQueryState";

const copy = {
	loading: "Loading Unit…",
	error: "The Unit could not be loaded.",
	retry: "Retry",
};

describe("FieldQueryState", () => {
	it("shows a status line while pending and renders the screen from the data", () => {
		const { rerender } = render(
			<FieldQueryState<string> query={{ isPending: true }} {...copy}>
				{(data): React.ReactElement => <h1>{data}</h1>}
			</FieldQueryState>
		);
		expect(screen.getByRole("status")).toHaveTextContent("Loading Unit…");
		rerender(
			<FieldQueryState<string>
				query={{ isPending: false, isError: false, data: "Unit 01" }}
				{...copy}
			>
				{(data): React.ReactElement => <h1>{data}</h1>}
			</FieldQueryState>
		);
		expect(screen.getByRole("heading", { name: "Unit 01" })).toBeVisible();
	});

	it("shows the failure with a thumb-sized Retry that reads again", async () => {
		const user = userEvent.setup();
		const refetch = vi.fn();
		render(
			<FieldQueryState<string>
				{...copy}
				query={{
					isPending: false,
					isError: true,
					error: new Error("Boom"),
					isFetching: false,
					refetch,
				}}
			>
				{(): null => null}
			</FieldQueryState>
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"The Unit could not be loaded."
		);
		const retry = screen.getByRole("button", { name: "Retry" });
		expect(retry).toHaveClass("h-[44px]");
		await user.click(retry);
		expect(refetch).toHaveBeenCalledOnce();
	});

	it("treats a 404 as not found with the way back, and as a failure without one", () => {
		const query = {
			isPending: false as const,
			isError: true as const,
			error: new ApiRequestError(404, "Not found", "NOT_FOUND"),
			isFetching: false,
			refetch: vi.fn(),
		};
		const { rerender } = render(
			<FieldQueryState<string>
				{...copy}
				query={query}
				notFound={{
					message: "This Unit is not in your work.",
					back: <a href="/field">Back to Projects</a>,
				}}
			>
				{(): null => null}
			</FieldQueryState>
		);
		expect(screen.getByRole("status")).toHaveTextContent(
			"This Unit is not in your work."
		);
		expect(
			screen.getByRole("link", { name: "Back to Projects" })
		).toBeVisible();
		expect(screen.queryByRole("alert")).toBeNull();
		rerender(
			<FieldQueryState<string> {...copy} query={query}>
				{(): null => null}
			</FieldQueryState>
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"The Unit could not be loaded."
		);
	});
});
