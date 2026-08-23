import { supabase } from "@/auth/supabase";
import { entityModule } from "./entityModule";
export const drawings = entityModule("drawings");

export const createDrawingSignedUrl = async (storagePath: string) => {
	const { data, error } = await supabase.storage
		.from("drawings")
		.createSignedUrl(storagePath, 60);
	if (error) throw error;
	return data.signedUrl;
};
