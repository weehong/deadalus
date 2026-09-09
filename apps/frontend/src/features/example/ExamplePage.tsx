import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { MatchForm, type MatchFormValues } from "@/features/example/MatchForm";
import { MatchesChart } from "@/features/example/MatchesChart";
import { MatchesTable } from "@/features/example/MatchesTable";
import {
	useCreateMatchMutation,
	useMatchesQuery,
} from "@/features/example/useMatchesQuery";

/**
 * Reference page wiring together TanStack Query + Table, React Hook Form + Zod,
 * a Nivo chart, a Zustand store and i18n against the real API
 * (`GET`/`POST /api/v1/matches`). Self-contained and safe to delete: remove
 * `src/features/example`, `src/routes/_console/example.ts`,
 * `src/store/useExampleStore.ts`, and the `example` translation keys. Nothing
 * links to it; it is reached by URL only. On the backend, the matching slice is `src/{routes,controllers,services,
 * schemas}/matches.*`, its OpenAPI block in `src/openapi/registry.ts`, the
 * `Match` model, and `prisma/seed.ts`.
 */
export const ExamplePage = (): FunctionComponent => {
	const { t } = useTranslation();
	const matchesQuery = useMatchesQuery();
	const createMatch = useCreateMatchMutation();

	const handleCreate = (values: MatchFormValues): void => {
		createMatch.mutate(values);
	};

	if (matchesQuery.isPending) {
		return <p className="p-8">{t("example.loading")}</p>;
	}

	if (matchesQuery.isError) {
		return <p className="p-8 text-red-600">{t("example.error")}</p>;
	}

	const matches = matchesQuery.data;

	return (
		<div className="flex flex-col gap-8 p-8">
			<h1 className="text-2xl font-bold">{t("example.title")}</h1>
			<section className="flex flex-col gap-6 lg:flex-row">
				<div className="flex-1">
					<h2 className="mb-2 font-semibold">{t("example.tableHeading")}</h2>
					<MatchesTable data={matches} />
				</div>
				<div className="flex-1">
					<h2 className="mb-2 font-semibold">{t("example.formHeading")}</h2>
					<MatchForm onCreate={handleCreate} />
					{createMatch.isError ? (
						<p className="mt-2 text-red-600">{createMatch.error.message}</p>
					) : null}
				</div>
			</section>
			<section>
				<h2 className="mb-2 font-semibold">{t("example.chartHeading")}</h2>
				<MatchesChart data={matches} />
			</section>
		</div>
	);
};
