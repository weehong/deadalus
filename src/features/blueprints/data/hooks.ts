/* eslint-disable @typescript-eslint/unbound-method -- module methods do not use this */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sites } from "./sites";
import { makeEntityHooks, blueprintKeys } from "./queryHooks";
import { storeys } from "./storeys";
import { floorPlans } from "./floorPlans";
import { units } from "./units";
import { installations } from "./installations";
import { subcontractors } from "./subcontractors";
import { scopeAssignments } from "./scopeAssignments";
import { drawings } from "./drawings";
import type { Database } from "./database";

export const siteKeys = {
	all: [...blueprintKeys.all, "sites"] as const,
	detail: (id: string) => [...blueprintKeys.all, "sites", id] as const,
};
export const useSitesQuery = () =>
	useQuery({ queryKey: siteKeys.all, queryFn: sites.list });
export const useSiteQuery = (id: string) =>
	useQuery({
		queryKey: siteKeys.detail(id),
		queryFn: () => sites.read(id),
		enabled: Boolean(id),
	});
export const useCreateSite = () => {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (value: Database["public"]["Tables"]["sites"]["Insert"]) =>
			sites.create(value),
		onSuccess: () => client.invalidateQueries({ queryKey: siteKeys.all }),
	});
};
export const useUpdateSite = () => {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			value,
		}: {
			id: string;
			value: Database["public"]["Tables"]["sites"]["Update"];
		}) => sites.update(id, value),
		onSuccess: (_site, { id }) =>
			Promise.all([
				client.invalidateQueries({ queryKey: siteKeys.all }),
				client.invalidateQueries({ queryKey: siteKeys.detail(id) }),
			]),
	});
};
export const useDeleteSite = () => {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => sites.remove(id),
		onSuccess: () => client.invalidateQueries({ queryKey: siteKeys.all }),
	});
};
export const storeyHooks = makeEntityHooks("storeys", storeys);
export const floorPlanHooks = makeEntityHooks("floor_plans", floorPlans);
export const unitHooks = makeEntityHooks("units", units);
export const installationHooks = makeEntityHooks(
	"installations",
	installations
);
export const subcontractorHooks = makeEntityHooks(
	"subcontractors",
	subcontractors
);
export const scopeAssignmentHooks = makeEntityHooks(
	"scope_assignments",
	scopeAssignments
);
export const drawingHooks = makeEntityHooks("drawings", drawings);
