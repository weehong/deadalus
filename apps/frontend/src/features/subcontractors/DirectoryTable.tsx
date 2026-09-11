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
import type { SubcontractorRow } from "./api";

interface DirectoryTableProps {
	data: Array<SubcontractorRow>;
	meta: PaginationMeta;
	onPageChange: (page: number) => void;
}

const columnHelper = createColumnHelper<SubcontractorRow>();

export const DirectoryTable = ({
	data,
	meta,
	onPageChange,
}: DirectoryTableProps): React.ReactElement => {
	const { t } = useTranslation();
	const columns = [
		columnHelper.accessor("name", {
			header: t("subcontractors.columns.name"),
			cell: ({ row, getValue }): React.ReactNode => (
				<Link
					className="text-accent-700 underline underline-offset-4"
					params={{ id: row.original.id }}
					to="/subcontractors/$id"
				>
					{getValue()}
				</Link>
			),
		}),
		columnHelper.accessor("memberCount", {
			header: t("subcontractors.columns.members"),
		}),
		columnHelper.accessor("phones", {
			header: t("subcontractors.columns.phones"),
			cell: ({ getValue }): React.ReactNode => (
				<div className="flex flex-wrap gap-x-4 gap-y-1 break-all">
					{getValue().map((phone) => (
						<span key={phone}>{phone}</span>
					))}
				</div>
			),
		}),
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
				aria-label={t("subcontractors.pagination.label")}
				className="mt-4 flex flex-wrap items-center justify-between gap-3"
			>
				<p aria-live="polite" className="text-sm">
					{t("subcontractors.pagination.summary", {
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
						{t("subcontractors.pagination.previous")}
					</Button>
					<Button
						disabled={meta.page >= pages}
						variant="secondary"
						onClick={(): void => {
							onPageChange(meta.page + 1);
						}}
					>
						{t("subcontractors.pagination.next")}
					</Button>
				</div>
			</nav>
		</>
	);
};
