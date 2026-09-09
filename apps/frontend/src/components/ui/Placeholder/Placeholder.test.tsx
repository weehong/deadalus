import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Placeholder } from "./Placeholder";

describe("Placeholder", () => {
	it("frames its message", () => {
		const { container } = render(<Placeholder>Not built yet</Placeholder>);
		expect(screen.getByText("Not built yet")).toBeInTheDocument();
		expect(container.querySelector(".blueprint-frame")).not.toBeNull();
	});
});
