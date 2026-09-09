import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StartupConfigurationError } from "./StartupConfigurationError";

describe("StartupConfigurationError", () => {
	it("names every missing variable in an alert", () => {
		render(
			<StartupConfigurationError
				missingVariables={["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]}
			/>
		);
		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Daedalus could not start");
		expect(
			screen.getAllByRole("listitem").map((item) => item.textContent)
		).toEqual(["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]);
	});
});
