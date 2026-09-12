import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QR_QUIET_ZONE, qrCodePath } from "@/features/projects/qr-code";

/** One printed label: what it carries and what it says. */
export interface QrLabelProps {
	/** The absolute URL the code encodes: the Unit's Field screen (ADR-0010). */
	url: string;
	/** The Unit's full label, as the glossary composes it: #12-01. */
	label: string;
	projectCode: string;
	blockName: string;
}

/**
 * One QR label at its printed size: the code on the left at about 30mm, the
 * Unit's full label large beside it, and the Project code and Block name
 * beneath in small type, so a label can be checked against a door by eye and
 * a loose sheet identified. Both lines are clipped, never wrapped.
 */
export const QrLabel = ({
	url,
	label,
	projectCode,
	blockName,
}: QrLabelProps): React.ReactElement => {
	const { t } = useTranslation();
	const { moduleCount, path } = useMemo(() => qrCodePath(url), [url]);
	// The quiet zone is part of the code: without four light modules around it
	// a scanner may not find the code at all. It lives in the viewBox, so the
	// box stays 30mm square and the modules shrink to make room.
	const span = moduleCount + QR_QUIET_ZONE * 2;
	return (
		<div className="flex h-[38.1mm] w-[63.5mm] items-center gap-[2.5mm] overflow-hidden px-[2.5mm] py-[2mm] text-ink">
			<svg
				aria-label={label}
				className="h-[30mm] w-[30mm] flex-none"
				data-qr-url={url}
				role="img"
				shapeRendering="crispEdges"
				viewBox={`${-QR_QUIET_ZONE} ${-QR_QUIET_ZONE} ${span} ${span}`}
			>
				<path d={path} fill="currentColor" />
			</svg>
			<div className="min-w-0 flex-1">
				<p className="m-0 overflow-hidden font-heading text-[5mm] leading-none font-bold whitespace-nowrap">
					{label}
				</p>
				<p className="m-0 mt-[1.5mm] overflow-hidden text-[2.6mm] leading-none whitespace-nowrap">
					{`${projectCode} · ${t("projects.qrLabels.block", { name: blockName })}`}
				</p>
			</div>
		</div>
	);
};
