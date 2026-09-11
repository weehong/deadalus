import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MembersTable } from "./MembersTable";

describe("Members table", () => {
	it("labels the Members and displays their names and stored phones", () => {
		render(
			<MembersTable
				members={[{ id: "alex", name: "Alex Tan", phone: "+6591234567" }]}
			/>
		);
		expect(screen.getByRole("table", { name: "Members" })).toBeVisible();
		expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
		expect(
			screen.getByRole("columnheader", { name: "Phone number" })
		).toBeVisible();
		expect(screen.getByRole("cell", { name: "Alex Tan" })).toBeVisible();
		expect(screen.getByRole("cell", { name: "+6591234567" })).toBeVisible();
	});
});

it("offers a Remove action for each Member and prevents repeated requests while busy", () => {
	const onRemove = vi.fn();
	const members = [{ id: "alex", name: "Alex Tan", phone: "+6591234567" }];
	const { rerender } = render(
		<MembersTable members={members} onRemove={onRemove} />
	);
	fireEvent.click(screen.getByRole("button", { name: "Remove Alex Tan" }));
	expect(onRemove).toHaveBeenCalledWith("alex");
	rerender(
		<MembersTable
			members={members}
			removingMemberId="alex"
			onRemove={onRemove}
		/>
	);
	expect(
		screen.getByRole("button", { name: "Remove Alex Tan" })
	).toBeDisabled();
});

it("opens a Member's edit action and replaces only that row with the inline form", () => {
	const onEdit = vi.fn();
	const member = { id: "alex", name: "Alex", phone: "+6591234567" };
	const { rerender } = render(
		<MembersTable members={[member]} onEdit={onEdit} />
	);
	fireEvent.click(screen.getByRole("button", { name: "Edit Alex" }));
	expect(onEdit).toHaveBeenCalledWith(member);
	rerender(
		<MembersTable
			editForm={<form aria-label="Edit Member" />}
			editingMemberId="alex"
			members={[member]}
			onEdit={onEdit}
		/>
	);
	expect(screen.getByRole("form", { name: "Edit Member" })).toBeVisible();
	expect(screen.queryByRole("cell", { name: "Alex" })).not.toBeInTheDocument();
});
