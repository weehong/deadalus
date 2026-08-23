import { useTranslation } from "react-i18next";
import { PageHeading } from "@/components/ui/PageHeading";

export type BlueprintStubProps = {
	titleKey:
		| "blueprints.structure"
		| "blueprints.units"
		| "blueprints.unitTitle"
		| "blueprints.subcontractors"
		| "blueprints.upload";
};
export const BlueprintStub = ({ titleKey }: BlueprintStubProps) => {
	const { t } = useTranslation();
	return (
		<PageHeading
			context={t("blueprints.sitePlaceholder")}
			title={t(titleKey)}
		/>
	);
};
