import { useTranslation } from "react-i18next";
import type { UnitMatrixBlock } from "@/features/projects/unitMatrixTypes";
export const UnitMatrixTable = ({
	block,
}: {
	block: UnitMatrixBlock;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<div
			aria-label={t("projects.upload.matrix", { name: block.name })}
			className="max-w-full overflow-x-auto"
			role="region"
			tabIndex={0}
		>
			<table
				aria-label={t("projects.upload.matrix", { name: block.name })}
				className="w-full border-collapse text-sm"
			>
				<thead>
					<tr>
						<th className="border border-rule p-3 text-left" scope="col">
							{t("projects.upload.storey")}
						</th>
						{block.stacks.map((stack, index) => (
							<th
								key={`${stack}-${index}`}
								className="min-w-24 border border-rule p-3"
								scope="col"
							>
								{stack}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{block.storeys.map((storey, index) => (
						<tr key={`${storey.name}-${index}`}>
							<th className="border border-rule p-3 text-left" scope="row">
								{storey.name}
							</th>
							{storey.cells.map((cell, cellIndex) => (
								<td
									key={cellIndex}
									className="border border-rule p-3 whitespace-nowrap"
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
