import type { HTMLAttributes } from "react";

export type TagTone = "neutral" | "positive" | "warning";
export type TagProps = HTMLAttributes<HTMLSpanElement> & { tone?: TagTone };
const tones: Record<TagTone, string> = {
	neutral: "bg-steel-100 text-steel-700",
	positive: "bg-emerald-100 text-emerald-800",
	warning: "bg-amber-100 text-amber-900",
};
export const Tag = ({
	className = "",
	tone = "neutral",
	...props
}: TagProps) => (
	<span
		className={`inline-flex px-2 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
		{...props}
	/>
);
