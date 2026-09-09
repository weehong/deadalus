import type { TFunction } from "i18next";

/** The Daedalus copy for the brand panel, supplied as data so the panel stays generic. */
export const getBrandContent = (
	t: TFunction
): {
	kicker: string;
	headline: string;
	blurb: string;
	hierarchy: Array<string>;
} => ({
	kicker: t("auth.brandKicker"),
	headline: t("auth.brandHeadline"),
	blurb: t("auth.brandBlurb"),
	hierarchy: [
		t("auth.hierarchy.projects"),
		t("auth.hierarchy.blocks"),
		t("auth.hierarchy.storeys"),
		t("auth.hierarchy.units"),
	],
});
