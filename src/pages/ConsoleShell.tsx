import { Outlet } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Sidebar, SidebarStatus } from "@/components/layout";
import { consoleNavigation } from "@/features/console/navigation";

// The frame every console screen renders inside: skip link, sidebar, content. The header lands here next.
export const ConsoleShell = (): FunctionComponent => {
	const { t } = useTranslation();
	// The moment the shell mounted — honest until a real sync clock feeds the same prop.
	const [syncTime] = useState(() => dayjs().format("HH:mm"));
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
				<Sidebar
					items={items}
					scope={t("console.scope")}
					status={<SidebarStatus syncTime={syncTime} />}
				/>
			</div>
			<main className="p-12" id="content">
				<Outlet />
			</main>
		</div>
	);
};
