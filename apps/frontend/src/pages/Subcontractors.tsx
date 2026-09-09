import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";

/** The Subcontractor directory. A placeholder until the Subcontractor model exists. */
export const Subcontractors = (): FunctionComponent => {
	const { t } = useTranslation();
	return (
		<Page>
			<PageHeader
				heading={t("console.subcontractors.heading")}
				kicker={t("console.subcontractors.kicker")}
			/>
			<Placeholder>{t("console.notBuilt")}</Placeholder>
		</Page>
	);
};
