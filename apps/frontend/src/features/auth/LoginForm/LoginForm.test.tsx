import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";
import { loginSchema } from "./loginSchema";

describe("loginSchema", () => {
	it("accepts a well-formed address and any non-empty password", () => {
		expect(
			loginSchema.safeParse({ email: "a@b.co", password: "x" }).success
		).toBe(true);
	});

	it("rejects an empty password and a malformed address", () => {
		expect(
			loginSchema.safeParse({ email: "a@b.co", password: "" }).success
		).toBe(false);
		expect(
			loginSchema.safeParse({ email: "not-an-email", password: "x" }).success
		).toBe(false);
	});
});

describe("LoginForm", () => {
	it("shows both required messages on an empty submit and does not call the handler", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);
		await user.click(screen.getByRole("button", { name: "Enter console" }));
		expect(
			await screen.findByText("Work email is required")
		).toBeInTheDocument();
		expect(screen.getByText("Password is required")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("rejects a malformed email before the handler is called", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);
		await user.type(screen.getByLabelText("Work email"), "not-an-email");
		await user.type(screen.getByLabelText("Password"), "x");
		await user.click(screen.getByRole("button", { name: "Enter console" }));
		expect(
			await screen.findByText("Enter a valid email address")
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits valid credentials, also on Enter", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<LoginForm onSubmit={onSubmit} />);
		await user.type(screen.getByLabelText("Work email"), "admin@example.com");
		await user.type(screen.getByLabelText("Password"), "x{Enter}");
		expect(onSubmit).toHaveBeenCalledWith(
			{ email: "admin@example.com", password: "x" },
			expect.anything()
		);
	});

	it("exposes autofill hints and refuses a second press while pending", () => {
		render(<LoginForm pending onSubmit={vi.fn()} />);
		expect(screen.getByLabelText("Work email")).toHaveAttribute(
			"autocomplete",
			"username"
		);
		expect(screen.getByLabelText("Password")).toHaveAttribute(
			"autocomplete",
			"current-password"
		);
		const submit = screen.getByRole("button", { name: "Signing in…" });
		expect(submit).toBeDisabled();
		expect(submit).toHaveAttribute("aria-busy", "true");
	});

	it("reveals the password and announces the toggle state", async () => {
		const user = userEvent.setup();
		render(<LoginForm onSubmit={vi.fn()} />);
		await user.click(screen.getByRole("button", { name: "Show password" }));
		expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
		expect(
			screen.getByRole("button", { name: "Hide password" })
		).toHaveAttribute("aria-pressed", "true");
	});

	it("announces a supplied failure and clears it once the input changes", async () => {
		const user = userEvent.setup();
		render(<LoginForm error="Rejected" onSubmit={vi.fn()} />);
		expect(screen.getByRole("alert")).toHaveTextContent("Rejected");
		await user.type(screen.getByLabelText("Work email"), "a");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
