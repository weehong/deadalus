import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeading } from "@/components/ui/PageHeading";
import {
	floorPlanHooks,
	unitHooks,
	useSitesQuery,
} from "@/features/blueprints/data/hooks";
import { UnitsList } from "@/features/blueprints/units";

const UnitsPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const sites = useSitesQuery();
	const site = sites.data?.[0];
	const plans = floorPlanHooks.useList(site?.id ?? "");
	const units = unitHooks.useList(site?.id ?? "");
	const [planId, setPlanId] = useState("");
	const selectedPlanId = planId || plans.data?.[0]?.id || "";
	if (sites.isPending || plans.isPending || units.isPending)
		return <p>{t("blueprints.loading")}</p>;
	if (!site) return <p>{t("blueprints.noSite")}</p>;
	return (
		<main>
			<PageHeading context={site.name} title={t("blueprints.units")} />
			{plans.data?.length ? (
				<UnitsList
					floorPlans={plans.data}
					selectedPlanId={selectedPlanId}
					units={units.data ?? []}
					onPlanChange={setPlanId}
					onOpen={(unitId) =>
						void navigate({
							to: "/blueprints/units/$unitId",
							params: { unitId },
						})
					}
				/>
			) : (
				<p>{t("blueprints.unitsScreen.noPlans")}</p>
			)}
		</main>
	);
};
export const Route = createFileRoute("/_console/blueprints/units")({
	component: UnitsPage,
});
