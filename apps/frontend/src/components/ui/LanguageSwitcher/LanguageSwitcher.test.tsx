import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "@/common/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
	afterEach(async () => {
		await i18n.changeLanguage("en-US");
	});

	it("switches the active language and the document language", async () => {
		const user = userEvent.setup();
		render(<LanguageSwitcher />);
		await user.selectOptions(
			screen.getByRole("combobox", { name: "Language" }),
			"zh-CN"
		);
		expect(i18n.resolvedLanguage).toBe("zh-CN");
		expect(document.documentElement.lang).toBe("zh-CN");
		expect(screen.getByRole("combobox", { name: "语言" })).toHaveValue("zh-CN");
	});
});
