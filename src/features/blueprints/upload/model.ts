export const MAX_DRAWING_BYTES = 1024 * 1024 * 1024;
export const ACCEPTED_DRAWING_EXTENSIONS = [
	"pdf",
	"dwg",
	"dxf",
	"rvt",
] as const;

export type DrawingMetadata = { discipline: string; revision: string | null };
const disciplines: Record<string, string> = {
	A: "Architectural",
	C: "Civil",
	E: "Electrical",
	M: "Mechanical",
	P: "Plumbing",
	S: "Structural",
};
export const parseDrawingFilename = (name: string): DrawingMetadata => {
	const stem = name.replace(/\.[^.]+$/, "");
	const discipline =
		disciplines[
			stem.match(/^([A-Za-z])(?:[-_\d])/i)?.[1]?.toUpperCase() ?? ""
		] ?? "Unassigned";
	const revision =
		stem.match(/(?:^|[-_\s])rev(?:ision)?[-_\s]*([A-Za-z0-9]+)$/i)?.[1] ?? null;
	return { discipline, revision };
};
export type UploadState = "queued" | "uploading" | "uploaded" | "failed";
export type UploadQueueItem = {
	id: string;
	file: File;
	progress: number;
	state: UploadState;
	metadata: DrawingMetadata;
	error?: string;
};
export const summarizeQueue = (items: ReadonlyArray<UploadQueueItem>) => ({
	documents: items.length,
	totalBytes: items.reduce((sum, item) => sum + item.file.size, 0),
	uploadedBytes: items.reduce(
		(sum, item) => sum + (item.file.size * item.progress) / 100,
		0
	),
});
export const formatBytes = (bytes: number) =>
	bytes >= 1024 ** 3
		? `${(bytes / 1024 ** 3).toFixed(1)} GB`
		: bytes >= 1024 ** 2
			? `${(bytes / 1024 ** 2).toFixed(1)} MB`
			: `${Math.ceil(bytes / 1024)} KB`;
