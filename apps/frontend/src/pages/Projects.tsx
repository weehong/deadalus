import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";

/** The Console's first screen. A placeholder until the Project model exists. */
export const Projects = (): FunctionComponent => {
	const { t } = useTranslation();
	return (
		<Page>
			<PageHeader
				heading={t("console.projects.heading")}
				kicker={t("console.projects.kicker")}
			/>
			<Placeholder>{t("console.notBuilt")}</Placeholder>
		</Page>
	);
};
