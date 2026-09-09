import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
	it("is announced as Daedalus", () => {
		render(<Logo />);
		expect(screen.getByRole("img", { name: "Daedalus" })).toBeInTheDocument();
	});
});
