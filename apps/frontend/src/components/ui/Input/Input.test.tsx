import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
	it("forwards its ref and attributes", () => {
		const ref = createRef<HTMLInputElement>();
		render(<Input ref={ref} aria-label="Name" placeholder="Type here" />);
		const input = screen.getByRole("textbox", { name: "Name" });
		expect(ref.current).toBe(input);
		expect(input).toHaveAttribute("placeholder", "Type here");
	});
});
