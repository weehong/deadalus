import { supabase } from "@/auth/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Insert, Row, TableName, Update } from "./database";

export interface EntityModule<T extends TableName> {
	list(siteId: string): Promise<Array<Row<T>>>;
	read(id: string): Promise<Row<T> | null>;
	create(value: Insert<T>): Promise<Row<T>>;
	update(id: string, value: Update<T>): Promise<Row<T>>;
	remove(id: string): Promise<void>;
}

export const entityModule = <T extends TableName>(
	table: T
): EntityModule<T> => ({
	async list(siteId) {
		const { data, error } = await (supabase as SupabaseClient)
			.from(table)
			.select("*")
			.eq("site_id", siteId);
		if (error) throw error;
		return data as unknown as Array<Row<T>>;
	},
	async read(id) {
		const { data, error } = await (supabase as SupabaseClient)
			.from(table)
			.select("*")
			.eq("id", id)
			.maybeSingle();
		if (error) throw error;
		return data as Row<T> | null;
	},
	async create(value) {
		const { data, error } = await (supabase as SupabaseClient)
			.from(table)
			.insert(value)
			.select()
			.single();
		if (error) throw error;
		return data as Row<T>;
	},
	async update(id, value) {
		const { data, error } = await (supabase as SupabaseClient)
			.from(table)
			.update(value)
			.eq("id", id)
			.select()
			.single();
		if (error) throw error;
		return data as Row<T>;
	},
	async remove(id) {
		const { error } = await (supabase as SupabaseClient)
			.from(table)
			.delete()
			.eq("id", id);
		if (error) throw error;
	},
});
