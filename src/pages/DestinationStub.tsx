import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";

export type DestinationLabel =
	| "nav.workOrders"
	| "nav.systemStatus"
	| "nav.assets"
	| "nav.operators"
	| "nav.settings";

// A destination that exists but has no screen yet: its name, and nothing that could be mistaken for data.
export const DestinationStub = ({
	label,
}: {
	label: DestinationLabel;
}): FunctionComponent => {
	const { t } = useTranslation();
	return <h1 className="font-heading text-6xl">{t(label)}</h1>;
};
