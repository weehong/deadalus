import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
export const UnitCard = ({
	name,
	typeCode,
	badge,
	actions,
	details,
}: {
	name: string;
	typeCode?: string;
	/** Beside the name: the Unit's Progression. */
	badge?: ReactNode;
	actions?: ReactNode;
	/** Below the name row: the Unit's Items disclosure. */
	details?: ReactNode;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<div className="border-b border-rule p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<div className="min-w-0 break-words">
						<p className="m-0 font-semibold">{name}</p>
						<p className="m-0 text-sm">
							{typeCode ?? t("projects.detail.noType")}
						</p>
					</div>
					{badge}
				</div>
				{actions}
			</div>
			{details && <div className="mt-3">{details}</div>}
		</div>
	);
};
