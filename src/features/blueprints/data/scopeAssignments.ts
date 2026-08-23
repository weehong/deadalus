import { entityModule } from "./entityModule";
import { supabase } from "@/auth/supabase";
import type { ScopeCode } from "./database";
export const scopeAssignments = entityModule("scope_assignments");
export const removeScopeAssignment = async (
	subcontractorId: string,
	unitId: string,
	scopeCode: ScopeCode
) => {
	const { error } = await supabase
		.from("scope_assignments")
		.delete()
		.eq("subcontractor_id", subcontractorId)
		.eq("unit_id", unitId)
		.eq("scope_code", scopeCode);
	if (error) throw error;
};
