/* eslint-disable camelcase -- provider-shaped form values */
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { ScopeCode, Subcontractor } from "../data/database";
import { SCOPE_CODES } from "./model";
import { subcontractorSchema, type SubcontractorValues } from "./schema";
type Props = {
	initial?: Subcontractor;
	open: boolean;
	onClose: () => void;
	onSubmit: (values: SubcontractorValues) => Promise<void> | void;
};
const empty: SubcontractorValues = {
	company_name: "",
	trade: "",
	contact_person: "",
	phone: "",
	email: "",
	contract_reference: "",
	default_scope_codes: [],
};
export const SubcontractorDialog = ({
	initial,
	open,
	onClose,
	onSubmit,
}: Props) => {
	const { t } = useTranslation();
	const [values, setValues] = useState<SubcontractorValues>(() =>
		initial
			? {
					company_name: initial.company_name,
					trade: initial.trade,
					contact_person: initial.contact_person ?? "",
					phone: initial.phone ?? "",
					email: initial.email ?? "",
					contract_reference: initial.contract_reference ?? "",
					default_scope_codes: initial.default_scope_codes,
				}
			: empty
	);
	const [error, setError] = useState<string>();
	const field = (
		name: keyof Omit<SubcontractorValues, "default_scope_codes">,
		label: string
	) => (
		<label>
			{label}
			<input
				value={values[name]}
				onChange={(event) => {
					setValues({ ...values, [name]: event.target.value });
				}}
			/>
		</label>
	);
	return (
		<Dialog className="relative z-50" open={open} onClose={onClose}>
			<div className="fixed inset-0 bg-ink/40" />
			<div className="fixed inset-0 grid place-items-center p-4">
				<DialogPanel className="w-full max-w-lg bg-surface p-6">
					<DialogTitle>
						{t(initial ? "blueprints.scope.editTitle" : "blueprints.scope.add")}
					</DialogTitle>
					<form
						className="grid gap-3"
						onSubmit={(event) => {
							event.preventDefault();
							const result = subcontractorSchema.safeParse(values);
							if (!result.success) {
								setError(result.error.issues[0]?.message);
								return;
							}
							void onSubmit(result.data);
						}}
					>
						{field("company_name", t("blueprints.scope.company"))}
						{field("trade", t("blueprints.scope.trade"))}
						{field("contact_person", t("blueprints.scope.contact"))}
						{field("phone", t("blueprints.scope.phone"))}
						{field("email", t("blueprints.scope.email"))}
						{field("contract_reference", t("blueprints.scope.contract"))}
						<fieldset>
							<legend>{t("blueprints.scope.defaults")}</legend>
							{SCOPE_CODES.map((code) => (
								<label key={code}>
									<input
										checked={values.default_scope_codes.includes(code)}
										type="checkbox"
										onChange={(event) => {
											const codes: Array<ScopeCode> = event.target.checked
												? [...values.default_scope_codes, code]
												: values.default_scope_codes.filter(
														(item) => item !== code
													);
											setValues({ ...values, default_scope_codes: codes });
										}}
									/>{" "}
									{code}
								</label>
							))}
						</fieldset>
						{error && <p role="alert">{error}</p>}
						<div className="flex justify-end gap-2">
							<Button type="button" variant="secondary" onClick={onClose}>
								{t("blueprints.form.cancel")}
							</Button>
							<Button type="submit">{t("blueprints.form.save")}</Button>
						</div>
					</form>
				</DialogPanel>
			</div>
		</Dialog>
	);
};
