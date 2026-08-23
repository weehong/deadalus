import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignInForm } from "./SignInForm";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => ({ "auth.email": "Work email", "auth.emailPlaceholder": "you@company.com", "auth.password": "Password", "auth.passwordPlaceholder": "Enter your password", "auth.showPassword": "Show password", "auth.hidePassword": "Hide password", "auth.submit": "Sign in", "auth.submitting": "Signing in…", "auth.validation.emailRequired": "Work email is required", "auth.validation.emailInvalid": "Enter a valid email address", "auth.validation.passwordRequired": "Password is required" } as Record<string, string>)[key] ?? key }) }));

describe("SignInForm", () => {
	it("validates shape and submits valid credentials", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<SignInForm onSubmit={onSubmit} />);
		await user.click(await screen.findByRole("button", { name: "Sign in" }));
		expect(await screen.findByText("Work email is required")).toBeTruthy();
		expect(screen.getByText("Password is required")).toBeTruthy();
		expect(onSubmit).not.toHaveBeenCalled();
		await user.type(screen.getByLabelText("Work email"), "admin@example.com");
		await user.type(screen.getByLabelText("Password"), "x");
		await user.click(screen.getByRole("button", { name: "Sign in" }));
		expect(onSubmit).toHaveBeenCalledWith({ email: "admin@example.com", password: "x" }, expect.anything());
	});

	it("rejects a malformed email without enforcing password complexity", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<SignInForm onSubmit={onSubmit} />);
		await user.type(screen.getByLabelText("Work email"), "not-an-email");
		await user.type(screen.getByLabelText("Password"), "x");
		await user.click(screen.getByRole("button", { name: "Sign in" }));
		expect(await screen.findByText("Enter a valid email address")).toBeTruthy();
		expect(onSubmit).not.toHaveBeenCalled();
		await user.clear(screen.getByLabelText("Work email"));
		await user.type(screen.getByLabelText("Work email"), "admin@example.com");
		await user.keyboard("{Enter}");
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it("exposes autofill hints and disables submission while pending", () => {
		const onSubmit = vi.fn();
		render(<SignInForm pending onSubmit={onSubmit} />);
		expect(screen.getByLabelText("Work email").getAttribute("autocomplete")).toBe("username");
		expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("current-password");
		const submit = screen.getByRole("button", { name: "Signing in…" });
		expect((submit as HTMLButtonElement).disabled).toBe(true);
		expect(submit.getAttribute("aria-busy")).toBe("true");
	});

	it("reveals the password and announces a supplied failure", async () => {
		const user = userEvent.setup();
		render(<SignInForm error="Rejected" onSubmit={vi.fn()} />);
		expect((await screen.findByRole("alert")).textContent).toContain("Rejected");
		await user.click(await screen.findByRole("button", { name: "Show password" }));
		expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
		expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");
	});

	it("clears a supplied failure when the administrator corrects input", async () => {
		const user = userEvent.setup();
		render(<SignInForm error="Rejected" onSubmit={vi.fn()} />);
		expect(screen.getByRole("alert")).toBeTruthy();

		await user.type(screen.getByLabelText("Work email"), "admin@example.com");

		expect(screen.queryByRole("alert")).toBeNull();
	});
});
