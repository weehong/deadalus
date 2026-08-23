/** Hand-written from the Blueprint Manager migration. Regenerate with the Supabase CLI when database tooling is available. */
export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Array<Json>;
type Base = { id: string; created_at: string; updated_at: string };
export type Site = Base & { name: string; description: string | null };
export type Storey = Base & {
	site_id: string;
	name: string;
	number: number;
	level_from: number;
	level_to: number;
	structural_note: string | null;
};
export type FloorPlan = Base & {
	site_id: string;
	storey_id: string;
	name: string;
	code: string;
	slab_level: number;
	gross_area: number;
	structural_grid: string | null;
	source_drawing_id: string | null;
};
export type UnitStatus = "occupied" | "vacant" | "fit-out";
export type Unit = Base & {
	site_id: string;
	floor_plan_id: string;
	code: string;
	room_tags: Array<string>;
	usable_area: number;
	ceiling_height: number | null;
	entry_door: string | null;
	boundary_note: string | null;
	boundary_type: string | null;
	grid_reference: string | null;
	status: UnitStatus;
};
export type InstallationState = "live" | "commissioning" | "scheduled";
export type Installation = Base & {
	site_id: string;
	unit_id: string;
	equipment: string;
	model: string | null;
	asset_tag: string;
	location_in_unit: string | null;
	installed_date: string | null;
	state: InstallationState;
};
export type ScopeCode = "A" | "B" | "C" | "D" | "E" | "F";
export type Subcontractor = Base & {
	site_id: string;
	company_name: string;
	trade: string;
	contact_person: string | null;
	phone: string | null;
	email: string | null;
	contract_reference: string | null;
	default_scope_codes: Array<ScopeCode>;
};
export type ScopeAssignment = Base & {
	site_id: string;
	subcontractor_id: string;
	unit_id: string;
	scope_code: ScopeCode;
};
export type DrawingStatus = "queued" | "uploading" | "uploaded" | "failed";
export type Drawing = Base & {
	site_id: string;
	floor_plan_id: string | null;
	name: string;
	storage_path: string;
	size_bytes: number;
	mime_type: string | null;
	discipline: string | null;
	revision: string | null;
	status: DrawingStatus;
};

type Table<
	Row,
	Insert extends object,
	Update extends object = Partial<Insert>,
> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
type WithoutGenerated<T extends Base> = Omit<T, keyof Base> &
	Partial<Pick<T, "id" | "created_at" | "updated_at">>;
export interface Database {
	public: {
		Tables: {
			sites: Table<Site, WithoutGenerated<Site>>;
			storeys: Table<Storey, WithoutGenerated<Storey>>;
			floor_plans: Table<FloorPlan, WithoutGenerated<FloorPlan>>;
			units: Table<Unit, WithoutGenerated<Unit>>;
			installations: Table<Installation, WithoutGenerated<Installation>>;
			subcontractors: Table<Subcontractor, WithoutGenerated<Subcontractor>>;
			scope_assignments: Table<
				ScopeAssignment,
				WithoutGenerated<ScopeAssignment>
			>;
			drawings: Table<Drawing, WithoutGenerated<Drawing>>;
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: {
			unit_status: UnitStatus;
			installation_state: InstallationState;
			drawing_status: DrawingStatus;
			scope_code: ScopeCode;
		};
		CompositeTypes: Record<string, never>;
	};
}

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends TableName> =
	Database["public"]["Tables"][T]["Insert"];
export type Update<T extends TableName> =
	Database["public"]["Tables"][T]["Update"];
