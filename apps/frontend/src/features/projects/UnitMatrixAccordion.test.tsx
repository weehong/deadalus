import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { I18nextProvider } from "react-i18next";
import i18n from "@/common/i18n";
import { UnitMatrixAccordion } from "@/features/projects/UnitMatrixAccordion";
it("opens one Block at a time with counts and stack ranges", async () => {
	const blocks = ["West", "East"].map((name) => ({
		name,
		stacks: ["01", "02"],
		storeys: [{ name: "01", cells: ["A", "B"] }],
		unitCount: 2,
		warnings: [],
	}));
	render(<UnitMatrixAccordion blocks={blocks} />);
	expect(
		screen.getByRole("table", { name: "Unit Matrix · West" })
	).toBeVisible();
	await userEvent.click(
		screen.getByRole("button", {
			name: "East 1 Storeys · 2 Units · Stacks 01–02",
		})
	);
	expect(
		screen.queryByRole("table", { name: "Unit Matrix · West" })
	).not.toBeInTheDocument();
	expect(
		screen.getByRole("table", { name: "Unit Matrix · East" })
	).toBeVisible();
});
it("shows warning counts and translates stable codes with the original Storey label", () => {
	render(
		<UnitMatrixAccordion
			blocks={[
				{
					name: "North",
					stacks: ["01", "03"],
					storeys: [],
					unitCount: 0,
					warnings: [
						{
							code: "EMPTY_STOREY",
							label: "B1",
							message: "Do not render server prose",
						},
						{
							code: "NON_CONSECUTIVE_STACKS",
							message: "Do not render server prose",
						},
						{ code: "EMPTY_BLOCK", message: "Do not render server prose" },
					],
				},
			]}
		/>
	);
	expect(
		screen.getByRole("button", { name: /North.*3 warnings/ })
	).toBeVisible();
	expect(
		screen.getByText("Storey B1 was omitted because it has no Units.")
	).toBeVisible();
	expect(
		screen.getByText(
			"Stack numbers are not consecutive; the workbook numbers were kept."
		)
	).toBeVisible();
	expect(
		screen.getByText("This Block has no Units; review it before including it.")
	).toBeVisible();
	expect(
		screen.queryByText("Do not render server prose")
	).not.toBeInTheDocument();
});

it("renders Chinese warnings from codes and labels, including inferred stacks and duplicate Storeys", () => {
	const chinese = i18n.cloneInstance({ lng: "zh-CN" });
	render(
		<I18nextProvider i18n={chinese}>
			<UnitMatrixAccordion
				blocks={[
					{
						name: "North",
						stacks: ["01", "02"],
						storeys: [],
						unitCount: 0,
						warnings: [
							{
								code: "DUPLICATE_STOREY",
								label: "02",
								message: "Server English",
							},
							{ code: "INFERRED_STACKS", message: "Server English" },
						],
					},
				]}
			/>
		</I18nextProvider>
	);
	expect(screen.getByRole("button", { name: /2 条警告/ })).toBeVisible();
	expect(
		screen.getByText("楼层 02 已出现，已省略后面的重复行。")
	).toBeVisible();
	expect(
		screen.getByText("未找到竖列编号行；已从 1 开始为各列编号。")
	).toBeVisible();
});
