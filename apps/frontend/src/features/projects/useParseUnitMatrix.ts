import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { apiFetch } from "@/common/api";
import type { UnitMatrixPreview } from "@/features/projects/unitMatrixTypes";
export const parseUnitMatrix = (
	id: string,
	file: File
): Promise<UnitMatrixPreview> => {
	const body = new FormData();
	body.append("file", file);
	return apiFetch<UnitMatrixPreview>(
		`/api/v1/projects/${encodeURIComponent(id)}/unit-matrix/parse`,
		{ method: "POST", body }
	);
};
export const useParseUnitMatrix = (
	id: string
): UseMutationResult<UnitMatrixPreview, Error, File> =>
	useMutation({ mutationFn: (file: File) => parseUnitMatrix(id, file) });
