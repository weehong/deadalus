import { supabase } from "@/auth/supabase";
import { Upload } from "tus-js-client";
import { drawings } from "@/features/blueprints/data/drawings";
import type { UploadQueueItem } from "./model";

/* eslint-disable camelcase -- database columns intentionally follow Postgres naming. */

export const uploadDrawing = async (
	siteId: string,
	item: UploadQueueItem,
	onProgress: (percent: number) => void
): Promise<void> => {
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (!session) throw new Error("A Session is required to upload drawings.");
	const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`;
	const storagePath = `${siteId}/${item.id}/${item.file.name}`;
	await new Promise<void>((resolve, reject) => {
		const upload = new Upload(item.file, {
			chunkSize: 6 * 1024 * 1024,
			endpoint,
			headers: { authorization: `Bearer ${session.access_token}` },
			metadata: {
				bucketName: "drawings",
				contentType: item.file.type || "application/octet-stream",
				objectName: storagePath,
			},
			onError: reject,
			onProgress: (uploaded, total) => {
				onProgress(total === 0 ? 100 : (uploaded / total) * 100);
			},
			onSuccess: () => {
				resolve();
			},
			removeFingerprintOnSuccess: true,
			retryDelays: [0, 1000, 3000, 5000],
			uploadSize: item.file.size,
		});
		upload.start();
	});
	await drawings.create({
		site_id: siteId,
		floor_plan_id: null,
		name: item.file.name,
		storage_path: storagePath,
		size_bytes: item.file.size,
		mime_type: item.file.type || null,
		discipline: item.metadata.discipline,
		revision: item.metadata.revision,
		status: "uploaded",
	});
};
/* eslint-enable camelcase */
