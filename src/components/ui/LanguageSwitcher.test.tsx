import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "./LanguageSwitcher";

const changeLanguage = vi.fn<(language: string) => Promise<void>>(() => Promise.resolve());

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { changeLanguage, resolvedLanguage: "en-US" },
		t: (key: string) => ({
			"auth.chinese": "简体中文",
			"auth.english": "English",
			"auth.language": "Language",
		} as Record<string, string>)[key] ?? key,
	}),
}));

describe("LanguageSwitcher", () => {
	it("offers both languages and changes the active language from the keyboard", async () => {
		const user = userEvent.setup();
		render(<LanguageSwitcher />);

		const switcher = screen.getByRole("combobox", { name: "Language" });
		expect(screen.getByRole("option", { name: "English" })).toBeTruthy();
		expect(screen.getByRole("option", { name: "简体中文" })).toBeTruthy();

		await user.selectOptions(switcher, "zh-CN");
		expect(changeLanguage).toHaveBeenCalledWith("zh-CN");
	});
});
