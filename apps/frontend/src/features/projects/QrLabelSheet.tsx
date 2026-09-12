import { useTranslation } from "react-i18next";
import { QrLabel } from "@/features/projects/QrLabel";
import type { QrLabelUnit } from "@/features/projects/qr-labels";

/** The 21-up A4 layout of Avery L7160 stock: three columns by seven rows. */
export const LABELS_PER_SHEET = 21;

/**
 * The sheet geometry, in the millimetres the stock is cut to. It has to be a
 * stylesheet rather than utilities because `@page` and the page break are not
 * properties of any element; the page renders it while it is open, so the A4
 * page box never applies to the rest of the Console. On screen the sheets sit
 * at the same physical size behind a light border, so the preview is
 * faithful; in print the border and the controls go.
 */
const SHEET_STYLES = `
@page { size: A4; margin: 0; }
.qr-sheet {
	box-sizing: border-box;
	display: grid;
	grid-template-columns: repeat(3, 63.5mm);
	grid-auto-rows: 38.1mm;
	column-gap: 2.54mm;
	row-gap: 0;
	align-content: start;
	justify-content: start;
	width: 210mm;
	height: 297mm;
	padding: 15.15mm 7.2mm;
	overflow: hidden;
	background: #fff;
}
.qr-sheet + .qr-sheet { break-before: page; }
@media screen {
	.qr-sheet { margin: 0 auto 1rem; border: 1px solid rgb(0 0 0 / 0.18); }
}
@media print {
	.qr-print-hidden { display: none !important; }
	.qr-sheet { margin: 0; border: 0; }
}
`;

/**
 * The sheet stylesheet, rendered for as long as the label page is open. Plain
 * `<style>` on purpose: React leaves it where it is put and takes it away
 * again on unmount, where a hoisted stylesheet would outlive the route and
 * impose A4 on every other Console screen's print.
 */
export const QrSheetStyles = (): React.ReactElement => (
	<style>{SHEET_STYLES}</style>
);

/**
 * One Block's labels as A4 sheets: 21 to a sheet, filling rows left to right
 * in the order given, the last sheet left short. Each sheet is a page of its
 * own when printed, so a Block never shares paper with the next one.
 */
export const QrLabelSheet = ({
	projectCode,
	blockName,
	units,
}: {
	projectCode: string;
	blockName: string;
	/** The Block's labels, already in printing order. */
	units: Array<QrLabelUnit>;
}): React.ReactElement => {
	const { t } = useTranslation();
	const sheets = Array.from(
		{ length: Math.ceil(units.length / LABELS_PER_SHEET) },
		(_, index) =>
			units.slice(index * LABELS_PER_SHEET, (index + 1) * LABELS_PER_SHEET)
	);
	return (
		<>
			{sheets.map((sheet, index) => (
				<section
					key={sheet[0]?.unitId ?? index}
					className="qr-sheet"
					aria-label={t("projects.qrLabels.sheet", {
						block: blockName,
						number: index + 1,
					})}
				>
					{sheet.map((unit) => (
						<QrLabel
							key={unit.unitId}
							blockName={blockName}
							label={unit.label}
							projectCode={projectCode}
							url={unit.url}
						/>
					))}
				</section>
			))}
		</>
	);
};
