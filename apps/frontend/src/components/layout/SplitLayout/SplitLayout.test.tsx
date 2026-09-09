import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SplitLayout } from "./SplitLayout";

describe("SplitLayout", () => {
	it("places the aside in a complementary landmark and the content in main", () => {
		render(<SplitLayout aside={<p>Brand</p>}>Form</SplitLayout>);
		expect(screen.getByRole("complementary")).toHaveTextContent("Brand");
		expect(screen.getByRole("main")).toHaveTextContent("Form");
	});
});
