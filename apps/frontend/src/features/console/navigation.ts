import type { TFunction } from "i18next";
import type { LinkProps } from "@tanstack/react-router";

export type ConsoleNavigationEntry = {
	label: string;
	to: NonNullable<LinkProps["to"]>;
};

/** The Console's navigation entries, in display order. */
export const getConsoleNavigation = (
	t: TFunction
): Array<ConsoleNavigationEntry> => [
	{ label: t("console.navigation.projects"), to: "/projects" },
	{ label: t("console.navigation.subcontractors"), to: "/subcontractors" },
];
