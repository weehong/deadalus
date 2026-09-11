import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DirectoryTable } from "./DirectoryTable";
import { useSubcontractorsQuery } from "./useSubcontractorsQuery";

export const DirectoryPage = (): React.ReactElement => {
	const { t } = useTranslation();
	const [pagination, setPagination] = useState({ q: "", page: 1 });
	const [search, setSearch] = useState("");
	const q = useDebouncedValue(search.trim());
	// A page belongs to its search, including when paging during the debounce pause.
	const page = pagination.q === q ? pagination.page : 1;
	const query = useSubcontractorsQuery({ page, pageSize: 20, q });
	return (
		<Page>
			<PageHeader
				heading={t("console.subcontractors.heading")}
				kicker={t("console.subcontractors.kicker")}
				actions={
					<div className="flex min-w-0 flex-wrap items-center gap-3">
						<Input
							aria-label={t("subcontractors.search")}
							placeholder={t("subcontractors.search")}
							type="search"
							value={search}
							onChange={(event): void => {
								setSearch(event.target.value);
								setPagination({ q: event.target.value.trim(), page: 1 });
							}}
						/>
						<Link
							className="inline-flex min-h-10 items-center border border-accent bg-accent px-3 py-2 font-heading text-sm font-semibold text-canvas hover:bg-accent-600"
							to="/subcontractors/new"
						>
							{t("subcontractors.create.action")}
						</Link>
					</div>
				}
			/>
			{query.isPending ? (
				<p role="status">{t("subcontractors.loading")}</p>
			) : query.isError ? (
				<Alert>
					<p>{t("subcontractors.error")}</p>
					<Button
						pending={query.isFetching}
						variant="secondary"
						onClick={(): void => {
							void query.refetch();
						}}
					>
						{t("subcontractors.retry")}
					</Button>
				</Alert>
			) : query.data.meta.total === 0 ? (
				<div className="border border-rule p-7">
					<p className="m-0 max-w-[60ch] text-[15px] text-ink/70">
						{t(q ? "subcontractors.noMatches" : "subcontractors.empty")}
					</p>
					{q ? null : (
						<Link
							className="mt-4 inline-block text-sm text-accent-700 underline underline-offset-4"
							to="/subcontractors/new"
						>
							{t("subcontractors.emptyAction")}
						</Link>
					)}
				</div>
			) : (
				<DirectoryTable
					data={query.data.data}
					meta={query.data.meta}
					onPageChange={(nextPage): void => {
						setPagination({ q, page: nextPage });
					}}
				/>
			)}
		</Page>
	);
};
