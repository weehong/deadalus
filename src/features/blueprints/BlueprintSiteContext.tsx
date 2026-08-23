/* eslint-disable react-refresh/only-export-components -- provider and typed consumer intentionally share context identity. */
import { createContext, useContext, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Site } from "./data/database";
import { useSitesQuery } from "./data/hooks";

const BlueprintSiteContext = createContext<Site | undefined>(undefined);
export const useBlueprintSite = () => useContext(BlueprintSiteContext);
export const BlueprintSiteProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const { t } = useTranslation();
	const sites = useSitesQuery();
	if (sites.isPending) return <p role="status">{t("blueprints.loading")}</p>;
	const site = sites.data?.[0];
	if (!site)
		return (
			<section>
				<h1>{t("nav.blueprints")}</h1>
				<p>{t("blueprints.noSite")}</p>
			</section>
		);
	return <BlueprintSiteContext value={site}>{children}</BlueprintSiteContext>;
};
