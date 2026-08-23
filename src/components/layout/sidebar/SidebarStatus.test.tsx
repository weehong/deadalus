import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "@/common/i18n";
import { SidebarStatus } from "./SidebarStatus";

afterEach(async () => {
	await i18n.changeLanguage("en-US");
});

describe("SidebarStatus", () => {
	it("shows the supplied last-sync time without an impairment line", () => {
		render(<SidebarStatus syncTime="14:32" />);

		expect(screen.getByText("Last sync")).toBeTruthy();
		expect(screen.getByText("14:32")).toBeTruthy();
		expect(screen.queryByText(/service.*impaired/i)).toBeNull();
	});

	it("shows a singular impairment line when one service is impaired", () => {
		render(<SidebarStatus impairedServiceCount={1} syncTime="14:32" />);

		expect(screen.getByText("1 service impaired")).toBeTruthy();
	});

	it("pluralises impairment in English and Simplified Chinese", async () => {
		const { rerender } = render(
			<SidebarStatus impairedServiceCount={2} syncTime="14:32" />
		);
		expect(screen.getByText("2 services impaired")).toBeTruthy();

		await i18n.changeLanguage("zh-CN");
		rerender(<SidebarStatus impairedServiceCount={2} syncTime="14:32" />);
		expect(screen.getByText("2 项服务受影响")).toBeTruthy();
	});
});
