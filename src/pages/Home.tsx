import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";

export const Home = (): FunctionComponent => {
	const { t } = useTranslation();

	return (
		<main className="min-h-screen bg-canvas p-12 text-ink"><h1 className="font-heading text-6xl">{t("home.greeting")}</h1></main>
	);
};
