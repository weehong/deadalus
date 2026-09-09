import { LabelRow } from "@/components/ui/LabelRow";
import { Logo } from "@/components/ui/Logo";

type BrandPanelProps = {
	blurb: string;
	headline: string;
	hierarchy: Array<string>;
	kicker: string;
};

/** The solid deep-accent panel: wordmark, kicker, condensed headline, blurb and the hierarchy strip. */
export const BrandPanel = ({
	blurb,
	headline,
	hierarchy,
	kicker,
}: BrandPanelProps): React.ReactElement => (
	<div className="flex h-full flex-col justify-between gap-7 bg-accent-900 p-[clamp(24px,5vw,72px)] text-canvas">
		<Logo size="large" />
		<div>
			<p className="mb-3.5 text-[11px] tracking-[0.18em] uppercase text-accent-300">
				{kicker}
			</p>
			<h1 className="mb-3.5 max-w-[16ch] text-[clamp(34px,4.4vw,58px)] text-pretty">
				{headline}
			</h1>
			<p className="m-0 max-w-[44ch] text-[15px] text-accent-200">{blurb}</p>
		</div>
		<LabelRow
			className="border-accent-700 text-accent-300"
			labels={hierarchy}
		/>
	</div>
);
