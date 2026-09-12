import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import {
	LABELS_PER_SHEET,
	QrLabelSheet,
} from "@/features/projects/QrLabelSheet";
import type { QrLabelUnit } from "@/features/projects/qr-labels";

const units = (count: number): Array<QrLabelUnit> =>
	Array.from({ length: count }, (_, index) => ({
		unitId: `unit-${index + 1}`,
		label: `#01-${String(index + 1).padStart(2, "0")}`,
		url: `https://console.example.com/field/units/unit-${index + 1}`,
	}));

it("fills one sheet per 21 labels, in the order given, leaving the last one short", () => {
	render(
		<QrLabelSheet
			blockName="A"
			projectCode="EG2"
			units={units(LABELS_PER_SHEET + 1)}
		/>
	);
	const sheets = screen.getAllByRole("region");
	expect(sheets).toHaveLength(2);
	expect(sheets[0]).toHaveAccessibleName("Block A labels, sheet 1");
	expect(sheets[1]).toHaveAccessibleName("Block A labels, sheet 2");
	expect(within(sheets[0]!).getAllByRole("img")).toHaveLength(
		LABELS_PER_SHEET
	);
	const last = within(sheets[1]!).getAllByRole("img");
	expect(last).toHaveLength(1);
	expect(last[0]).toHaveAccessibleName("#01-22");
	expect(
		within(sheets[0]!)
			.getAllByRole("img")
			.map((code) => code.getAttribute("aria-label"))
			.slice(0, 3)
	).toEqual(["#01-01", "#01-02", "#01-03"]);
});

it("renders no sheet at all for a Block with no Units", () => {
	render(<QrLabelSheet blockName="A" projectCode="EG2" units={[]} />);
	expect(screen.queryAllByRole("region")).toHaveLength(0);
});
