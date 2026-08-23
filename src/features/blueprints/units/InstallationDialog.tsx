import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { mapProviderError } from "../structure/providerError";
import {
	createInstallationSchema,
	type InstallationFormValues,
} from "./installationSchema";

type Props = {
	initialValues?: InstallationFormValues;
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (values: InstallationFormValues) => Promise<void> | void;
};
const empty: InstallationFormValues = {
	assetTag: "",
	equipment: "",
	installedDate: "",
	location: "",
	model: "",
	state: "scheduled",
};

export const InstallationDialog = ({
	initialValues,
	isOpen,
	onClose,
	onSubmit,
}: Props) => {
	const { t } = useTranslation();
	const values = initialValues ?? empty;
	const [alert, setAlert] = useState<string>();
	const form = useForm<InstallationFormValues>({
		defaultValues: values,
		resolver: zodResolver(
			createInstallationSchema(t("blueprints.validation.required"))
		),
	});
	useEffect(() => {
		if (isOpen) form.reset(values);
	}, [form, isOpen, values]);
	const submit = form.handleSubmit(async (submitted) => {
		setAlert(undefined);
		try {
			await onSubmit(submitted);
		} catch (error) {
			const mapped = mapProviderError(error);
			if (mapped.kind === "field" && mapped.field === "assetTag")
				form.setError("assetTag", {
					message: t(mapped.messageKey, { defaultValue: mapped.messageKey }),
				});
			else setAlert(t(mapped.messageKey, { defaultValue: mapped.messageKey }));
		}
	});
	const field = (
		name: keyof InstallationFormValues,
		label: string,
		type = "text"
	) => (
		<Field
			error={form.formState.errors[name]?.message}
			id={`installation-${name}`}
			label={label}
		>
			<Input type={type} {...form.register(name)} />
		</Field>
	);
	return (
		<Dialog className="relative z-50" open={isOpen} onClose={onClose}>
			<div aria-hidden="true" className="fixed inset-0 bg-ink/40" />
			<div className="fixed inset-0 overflow-y-auto p-4">
				<div className="flex min-h-full items-center justify-center">
					<DialogPanel className="w-full max-w-xl border border-rule bg-surface p-6">
						<DialogTitle className="font-heading text-2xl font-semibold uppercase">
							{t(
								initialValues
									? "blueprints.installations.edit"
									: "blueprints.installations.create"
							)}
						</DialogTitle>
						<form
							noValidate
							className="mt-5 grid gap-4"
							onSubmit={(event) => void submit(event)}
						>
							{alert && <Alert>{alert}</Alert>}
							{field("equipment", t("blueprints.installations.equipment"))}
							{field("model", t("blueprints.installations.model"))}
							{field("assetTag", t("blueprints.installations.assetTag"))}
							{field("location", t("blueprints.installations.location"))}
							{field(
								"installedDate",
								t("blueprints.installations.installedDate"),
								"date"
							)}
							<Field
								id="installation-state"
								label={t("blueprints.installations.state")}
							>
								<select
									className="min-h-11 border border-rule bg-surface px-3"
									{...form.register("state")}
								>
									<option value="live">
										{t("blueprints.installations.live")}
									</option>
									<option value="commissioning">
										{t("blueprints.installations.commissioning")}
									</option>
									<option value="scheduled">
										{t("blueprints.installations.scheduled")}
									</option>
								</select>
							</Field>
							<div className="flex justify-end gap-3">
								<Button type="button" variant="secondary" onClick={onClose}>
									{t("blueprints.form.cancel")}
								</Button>
								<Button pending={form.formState.isSubmitting} type="submit">
									{t("blueprints.form.save")}
								</Button>
							</div>
						</form>
					</DialogPanel>
				</div>
			</div>
		</Dialog>
	);
};
