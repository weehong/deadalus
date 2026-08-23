import { Outlet, useRouterState } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { ConsoleDrawer, Sidebar, SidebarStatus } from "@/components/layout";
import { consoleNavigation } from "@/features/console/navigation";
import { BlueprintSidebarStats } from "@/features/blueprints/BlueprintSidebarStats";

// The frame every console screen renders inside: skip link, sidebar (fixed on desktop,
// a drawer below the medium breakpoint), and the content region. The header lands here next.
export const ConsoleShell = (): FunctionComponent => {
	const { t } = useTranslation();
	const inBlueprints = useRouterState({
		select: (state) => state.location.pathname.startsWith("/blueprints"),
	});
	// The moment the shell mounted — honest until a real sync clock feeds the same prop.
	const [syncTime] = useState(() => dayjs().format("HH:mm"));
	const items = consoleNavigation.map(({ labelKey, ...item }) => ({
		...item,
		label: t(labelKey),
		children: item.children?.map(({ labelKey: childLabelKey, ...child }) => ({
			...child,
			label: t(childLabelKey),
		})),
	}));
	const sidebar = (
		<Sidebar
			items={items}
			scope={t("console.scope")}
			status={
				inBlueprints ? (
					<>
						<BlueprintSidebarStats />
						<SidebarStatus syncTime={syncTime} />
					</>
				) : (
					<SidebarStatus syncTime={syncTime} />
				)
			}
		/>
	);
	return (
		<div className="min-h-screen bg-canvas text-ink md:grid md:grid-cols-[236px_minmax(0,1fr)]">
			<a
				className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:bg-surface focus:px-3 focus:py-2"
				href="#content"
			>
				{t("console.skipToContent")}
			</a>
			<ConsoleDrawer sidebar={sidebar} />
			<div className="hidden md:sticky md:top-0 md:block md:h-screen">
				{sidebar}
			</div>
			<main className="p-12" id="content">
				<Outlet />
			</main>
		</div>
	);
};
