import { describe, expect, it } from "vitest";
import { qrCodePath } from "@/features/projects/qr-code";

const URL = "https://console.example.com/field/units/cm5unit01";

describe("qrCodePath", () => {
	it("sizes the code to a real QR version, with no quiet zone of its own", () => {
		const { moduleCount } = qrCodePath(URL);
		// Versions 1 to 40 are 21, 25, 29 … modules square.
		expect(moduleCount).toBeGreaterThanOrEqual(21);
		expect((moduleCount - 21) % 4).toBe(0);
	});

	it("draws the top-left finder pattern as the first run of modules", () => {
		// Every QR code opens with a 7-module-wide finder pattern at the origin.
		expect(qrCodePath(URL).path.startsWith("M0 0h7v1h-7z")).toBe(true);
	});

	it("is deterministic, so reprinting a Unit gives the same label", () => {
		expect(qrCodePath(URL)).toEqual(qrCodePath(URL));
	});

	it("encodes each Unit differently, and a longer URL into a larger code", () => {
		const short = qrCodePath("http://localhost:5173/field/units/u1");
		const other = qrCodePath("http://localhost:5173/field/units/u2");
		expect(other.path).not.toBe(short.path);
		expect(other.moduleCount).toBe(short.moduleCount);
		expect(qrCodePath(`${URL}${"x".repeat(200)}`).moduleCount).toBeGreaterThan(
			short.moduleCount
		);
	});
});
