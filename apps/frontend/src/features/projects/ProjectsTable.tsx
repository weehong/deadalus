import { Link } from "@tanstack/react-router";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import type { PaginationMeta } from "@/common/api";
import { Button } from "@/components/ui/Button";
import type { ProjectRow } from "@/features/projects/api";

interface ProjectsTableProps {
	data: Array<ProjectRow>;
	meta: PaginationMeta;
	onPageChange: (page: number) => void;
}

const columnHelper = createColumnHelper<ProjectRow>();

export const ProjectsTable = ({
	data,
	meta,
	onPageChange,
}: ProjectsTableProps): React.ReactElement => {
	const { t } = useTranslation();
	const columns = [
		columnHelper.accessor("code", { header: t("projects.columns.code") }),
		columnHelper.accessor("name", {
			header: t("projects.columns.name"),
			cell: (info) => (
				<Link
					className="underline"
					params={{ id: info.row.original.id }}
					to="/projects/$id"
				>
					{info.getValue()}
				</Link>
			),
		}),
		columnHelper.accessor("blockCount", {
			header: t("projects.columns.blocks"),
		}),
		columnHelper.accessor("storeyCount", {
			header: t("projects.columns.storeys"),
		}),
		columnHelper.accessor("unitCount", { header: t("projects.columns.units") }),
	];
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		rowCount: meta.total,
		state: {
			pagination: { pageIndex: meta.page - 1, pageSize: meta.pageSize },
		},
	});
	const pages = Math.max(1, Math.ceil(meta.total / meta.pageSize));
	return (
		<>
			<div className="border border-rule">
				<table className="w-full table-fixed text-left text-sm">
					<thead>
						{table.getHeaderGroups().map((group) => (
							<tr key={group.id}>
								{group.headers.map((header) => (
									<th
										key={header.id}
										className="border-b border-rule px-3 py-3 font-semibold break-words"
										scope="col"
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className="border-b border-rule last:border-0">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-3 py-3 align-top break-words">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<nav
				aria-label={t("projects.pagination.label")}
				className="mt-4 flex flex-wrap items-center justify-between gap-3"
			>
				<p aria-live="polite" className="text-sm">
					{t("projects.pagination.summary", {
						page: meta.page,
						pages,
						total: meta.total,
					})}
				</p>
				<div className="flex gap-2">
					<Button
						disabled={meta.page <= 1}
						variant="secondary"
						onClick={(): void => {
							onPageChange(meta.page - 1);
						}}
					>
						{t("projects.pagination.previous")}
					</Button>
					<Button
						disabled={meta.page >= pages}
						variant="secondary"
						onClick={(): void => {
							onPageChange(meta.page + 1);
						}}
					>
						{t("projects.pagination.next")}
					</Button>
				</div>
			</nav>
		</>
	);
};
