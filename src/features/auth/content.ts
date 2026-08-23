import type { TFunction } from "i18next";
export const getBrandContent = (t: TFunction) => ({ kicker: t("auth.brandKicker"), headline: t("auth.brandHeadline"), blurb: t("auth.brandBlurb"), figures: [{ value: "12", label: t("auth.figures.sites") }, { value: "2.4k", label: t("auth.figures.assets") }, { value: "24/7", label: t("auth.figures.coverage") }] });
 
