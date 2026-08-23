import { z } from "zod";

export const installationStates = [
	"live",
	"commissioning",
	"scheduled",
] as const;
export const createInstallationSchema = (required = "This field is required") =>
	z.object({
		equipment: z.string().trim().min(1, required),
		model: z.string().trim(),
		assetTag: z.string().trim().min(1, required),
		location: z.string().trim(),
		installedDate: z.string(),
		state: z.enum(installationStates),
	});
export const installationSchema = createInstallationSchema();
export type InstallationFormValues = z.infer<typeof installationSchema>;
