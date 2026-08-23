import { supabase } from "@/auth/supabase";
import type { Database, Site } from "./database";
type Insert = Database["public"]["Tables"]["sites"]["Insert"];
type Update = Database["public"]["Tables"]["sites"]["Update"];
export const sites = {
	async list(): Promise<Array<Site>> {
		const { data, error } = await supabase
			.from("sites")
			.select("*")
			.order("created_at");
		if (error) throw error;
		return data;
	},
	async read(id: string): Promise<Site | null> {
		const { data, error } = await supabase
			.from("sites")
			.select("*")
			.eq("id", id)
			.maybeSingle();
		if (error) throw error;
		return data;
	},
	async create(value: Insert): Promise<Site> {
		const { data, error } = await supabase
			.from("sites")
			.insert(value)
			.select()
			.single();
		if (error) throw error;
		return data;
	},
	async update(id: string, value: Update): Promise<Site> {
		const { data, error } = await supabase
			.from("sites")
			.update(value)
			.eq("id", id)
			.select()
			.single();
		if (error) throw error;
		return data;
	},
	async remove(id: string): Promise<void> {
		const { error } = await supabase.from("sites").delete().eq("id", id);
		if (error) throw error;
	},
};
