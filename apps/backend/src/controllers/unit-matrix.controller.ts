import type { Request, Response } from "express";
import multer from "multer";
import { HttpError } from "@/lib/http-error.js";
import { parseUnitMatrix } from "@/services/unit-matrix.js";
import { requireMatrixProject } from "@/services/unit-matrix-project.js";
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
	fileFilter: (_request, file, callback) => {
		if (!/\.xlsx?$/i.test(file.originalname)) {
			callback(HttpError.badRequest("Choose an .xls or .xlsx workbook."));
			return;
		}
		callback(null, true);
	},
}).single("file");
export async function parseUnitMatrixController(
	request: Request,
	response: Response
): Promise<void> {
	await requireMatrixProject(request.params["id"] as string);
	await new Promise<void>((resolve, reject) => {
		upload(request, response, (error: unknown) => {
			if (error) {
				reject(
					error instanceof HttpError
						? error
						: HttpError.badRequest(
								error instanceof multer.MulterError &&
									error.code === "LIMIT_FILE_SIZE"
									? "The workbook must be 10 MB or smaller."
									: "Upload exactly one workbook in the file field."
							)
				);
				return;
			}
			resolve();
		});
	});
	if (!request.file) throw HttpError.badRequest("Choose a workbook to upload.");
	response.json({ data: parseUnitMatrix(request.file.buffer) });
}
