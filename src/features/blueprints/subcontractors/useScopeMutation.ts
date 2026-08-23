/* eslint-disable camelcase -- provider-shaped cache records */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blueprintKeys } from "../data/queryHooks";
import {
	removeScopeAssignment,
	scopeAssignments,
} from "../data/scopeAssignments";
import type { ScopeAssignment, ScopeCode } from "../data/database";
type Toggle = {
	checked: boolean;
	code: ScopeCode;
	siteId: string;
	subcontractorId: string;
	unitId: string;
};
export const useScopeMutation = (siteId: string, onError: () => void) => {
	const client = useQueryClient();
	const key = blueprintKeys.entity("scope_assignments", siteId);
	return useMutation({
		mutationFn: async (toggle: Toggle) =>
			toggle.checked
				? scopeAssignments.create({
						site_id: toggle.siteId,
						subcontractor_id: toggle.subcontractorId,
						unit_id: toggle.unitId,
						scope_code: toggle.code,
					})
				: removeScopeAssignment(
						toggle.subcontractorId,
						toggle.unitId,
						toggle.code
					),
		onMutate: async (toggle) => {
			await client.cancelQueries({ queryKey: key });
			const previous = client.getQueryData<Array<ScopeAssignment>>(key) ?? [];
			client.setQueryData<Array<ScopeAssignment>>(
				key,
				toggle.checked
					? [
							...previous,
							{
								id: `optimistic-${toggle.unitId}-${toggle.code}`,
								site_id: siteId,
								subcontractor_id: toggle.subcontractorId,
								unit_id: toggle.unitId,
								scope_code: toggle.code,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							},
						]
					: previous.filter(
							(a) =>
								!(
									a.subcontractor_id === toggle.subcontractorId &&
									a.unit_id === toggle.unitId &&
									a.scope_code === toggle.code
								)
						)
			);
			return { previous };
		},
		onError: (_error, _toggle, context) => {
			client.setQueryData(key, context?.previous);
			onError();
		},
		onSettled: () => client.invalidateQueries({ queryKey: key }),
	});
};
