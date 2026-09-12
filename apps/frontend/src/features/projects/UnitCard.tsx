import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
export const UnitCard = ({
	name,
	typeCode,
	actions,
}: {
	name: string;
	typeCode?: string;
	actions?: ReactNode;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule p-4">
			<div className="min-w-0 break-words">
				<p className="m-0 font-semibold">{name}</p>
				<p className="m-0 text-sm">{typeCode ?? t("projects.detail.noType")}</p>
			</div>
			{actions}
		</div>
	);
};
