/* eslint-disable camelcase -- provider-shaped form values */
import { describe, expect, it } from "vitest";
import { subcontractorSchema } from "./schema";
const valid = {
	company_name: "Acme",
	trade: "Mechanical",
	contact_person: "",
	phone: "",
	email: "",
	contract_reference: "",
	default_scope_codes: ["C"],
};
describe("subcontractor schema", () => {
	it("accepts an optional empty email", () => {
		expect(subcontractorSchema.safeParse(valid).success).toBe(true);
	});
	it("rejects an invalid email and missing company", () => {
		expect(
			subcontractorSchema.safeParse({ ...valid, email: "bad" }).success
		).toBe(false);
		expect(
			subcontractorSchema.safeParse({ ...valid, company_name: "" }).success
		).toBe(false);
	});
});
