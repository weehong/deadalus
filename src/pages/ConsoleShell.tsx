import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Sidebar } from "@/components/layout";
import { consoleNavigation } from "@/features/console/navigation";

// The frame every console screen renders inside: skip link, sidebar, content. The header lands here next.
export const ConsoleShell = (): FunctionComponent => {
	const { t } = useTranslation();
	const items = consoleNavigation.map(({ labelKey, ...item }) => ({
		...item,
		label: t(labelKey),
	}));
	return (
		<div className="min-h-screen bg-canvas text-ink md:grid md:grid-cols-[236px_minmax(0,1fr)]">
			<a
				className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:bg-surface focus:px-3 focus:py-2"
				href="#content"
			>
				{t("console.skipToContent")}
			</a>
			<div className="hidden md:sticky md:top-0 md:block md:h-screen">
				<Sidebar items={items} scope={t("console.scope")} />
			</div>
			<main className="p-12" id="content">
				<Outlet />
			</main>
		</div>
	);
};
