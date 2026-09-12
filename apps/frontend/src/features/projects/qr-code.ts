import qrcode from "qrcode-generator";

/** Error correction level M: the middle setting, robust to a scuffed label. */
const ERROR_CORRECTION = "M";
/** Type 0 lets the encoder pick the smallest version that holds the data. */
const AUTOMATIC_VERSION = 0;

/**
 * The light margin a QR code needs on every side, in modules, for a scanner to
 * find it at all. The standard's minimum, and the caller's to apply: the path
 * below covers the modules only.
 */
export const QR_QUIET_ZONE = 4;

/** A QR code as one SVG path, drawn on a grid of `moduleCount` square modules. */
export interface QrCode {
	/** The code's width and height in modules, which is also its viewBox. */
	moduleCount: number;
	/** The dark modules as a single path, horizontal runs merged. */
	path: string;
}

/**
 * Encode text as a QR code and describe it as one SVG path in module
 * coordinates, so a label prints crisply at any size and a sheet of them is
 * one element each rather than a thousand rectangles. The path covers the dark
 * modules alone; the caller leaves `QR_QUIET_ZONE` modules of light around it.
 */
export const qrCodePath = (text: string): QrCode => {
	const code = qrcode(AUTOMATIC_VERSION, ERROR_CORRECTION);
	code.addData(text);
	code.make();
	const moduleCount = code.getModuleCount();
	const runs: Array<string> = [];
	for (let row = 0; row < moduleCount; row += 1) {
		// `start` holds where the current run of dark modules began. The row is
		// walked one column past its end so that a run reaching the edge is
		// closed by the same branch as any other.
		let start: number | null = null;
		for (let column = 0; column <= moduleCount; column += 1) {
			const dark = column < moduleCount && code.isDark(row, column);
			if (dark && start === null) start = column;
			else if (!dark && start !== null) {
				const width = column - start;
				runs.push(`M${start} ${row}h${width}v1h-${width}z`);
				start = null;
			}
		}
	}
	return { moduleCount, path: runs.join("") };
};
