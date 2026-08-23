import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";

export const Home = (): FunctionComponent => {
	const { t } = useTranslation();
	return <h1 className="font-heading text-6xl">{t("home.greeting")}</h1>;
};
