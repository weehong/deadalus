/* eslint-disable camelcase -- provider-shaped cache fixtures */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ScopeAssignment } from "../data/database";
import { blueprintKeys } from "../data/queryHooks";
import { useScopeMutation } from "./useScopeMutation";

const { create, remove } = vi.hoisted(() => ({
	create: vi.fn(),
	remove: vi.fn(),
}));
vi.mock("../data/scopeAssignments", () => ({
	scopeAssignments: {
		create: (...args: Array<unknown>): Promise<unknown> =>
			create(...args) as Promise<unknown>,
	},
	removeScopeAssignment: (...args: Array<unknown>): Promise<unknown> =>
		remove(...args) as Promise<unknown>,
}));
const existing: ScopeAssignment = {
	id: "existing",
	site_id: "site",
	subcontractor_id: "sub",
	unit_id: "unit",
	scope_code: "A",
	created_at: "x",
	updated_at: "x",
};
const setup = () => {
	const client = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});
	const key = blueprintKeys.entity("scope_assignments", "site");
	client.setQueryData(key, [existing]);
	const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
	return { client, invalidate, key, wrapper };
};

describe("useScopeMutation", () => {
	it("updates the cache optimistically and invalidates on settle", async () => {
		create.mockResolvedValueOnce({});
		const context = setup();
		const alert = vi.fn();
		const { result } = renderHook(() => useScopeMutation("site", alert), {
			wrapper: context.wrapper,
		});
		act(() => {
			result.current.mutate({
				checked: true,
				code: "B",
				siteId: "site",
				subcontractorId: "sub",
				unitId: "unit",
			});
		});
		await waitFor(() => {
			expect(
				context.client
					.getQueryData<Array<ScopeAssignment>>(context.key)
					?.some((row) => row.scope_code === "B")
			).toBe(true);
		});
		await waitFor(() => {
			expect(context.invalidate).toHaveBeenCalledWith({
				queryKey: context.key,
			});
		});
		expect(alert).not.toHaveBeenCalled();
	});
	it("restores the previous cache and alerts when the provider rejects", async () => {
		remove.mockRejectedValueOnce(new Error("offline"));
		const context = setup();
		const alert = vi.fn();
		const { result } = renderHook(() => useScopeMutation("site", alert), {
			wrapper: context.wrapper,
		});
		act(() => {
			result.current.mutate({
				checked: false,
				code: "A",
				siteId: "site",
				subcontractorId: "sub",
				unitId: "unit",
			});
		});
		await waitFor(() => {
			expect(alert).toHaveBeenCalledOnce();
		});
		expect(context.client.getQueryData(context.key)).toEqual([existing]);
		expect(context.invalidate).toHaveBeenCalledWith({ queryKey: context.key });
	});
});
