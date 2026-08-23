import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import {
	useForm,
	type FieldValues,
	type Path,
	type UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { BlueprintFrame } from "@/components/ui/BlueprintFrame";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { mapProviderError } from "./providerError";
import {
	createFloorPlanSchema,
	createStoreySchema,
	createUnitSchema,
	type FloorPlanFormValues,
	type StoreyFormValues,
	type UnitFormValues,
} from "./schemas";

type BaseDialogProps<T> = {
	initialValues?: T;
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (values: T) => Promise<void> | void;
};

const DialogShell = ({
	children,
	isOpen,
	onClose,
	title,
}: {
	children: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	title: string;
}) => (
	<Dialog className="relative z-50" open={isOpen} onClose={onClose}>
		<div aria-hidden="true" className="fixed inset-0 bg-ink/40" />
		<div className="fixed inset-0 overflow-y-auto p-4">
			<div className="flex min-h-full items-center justify-center">
				<DialogPanel className="w-full max-w-xl bg-surface">
					<BlueprintFrame className="p-6">
						<DialogTitle className="font-display text-2xl font-bold">
							{title}
						</DialogTitle>
						{children}
					</BlueprintFrame>
				</DialogPanel>
			</div>
		</div>
	</Dialog>
);

const FormActions = ({
	onClose,
	pending,
}: {
	onClose: () => void;
	pending: boolean;
}) => {
	const { t } = useTranslation();
	return (
		<div className="flex justify-end gap-3 pt-2">
			<Button type="button" variant="secondary" onClick={onClose}>
				{t("blueprints.form.cancel")}
			</Button>
			<Button pending={pending} type="submit">
				{t("blueprints.form.save")}
			</Button>
		</div>
	);
};

const TextField = <T extends FieldValues>({
	form,
	label,
	name,
	required = false,
}: {
	form: UseFormReturn<T>;
	label: string;
	name: Path<T>;
	required?: boolean;
}) => (
	<Field
		error={form.formState.errors[name]?.message as string | undefined}
		id={name}
		label={label}
	>
		<Input {...form.register(name)} required={required} />
	</Field>
);
const NumberField = <T extends FieldValues>({
	form,
	label,
	name,
}: {
	form: UseFormReturn<T>;
	label: string;
	name: Path<T>;
}) => (
	<Field
		error={form.formState.errors[name]?.message as string | undefined}
		id={name}
		label={label}
	>
		<Input
			inputMode="decimal"
			step="any"
			type="number"
			{...form.register(name, { valueAsNumber: true })}
		/>
	</Field>
);

const useEntitySubmit = <T extends FieldValues>(
	form: UseFormReturn<T>,
	onSubmit: (values: T) => Promise<void> | void
) => {
	const { t } = useTranslation();
	const [alert, setAlert] = useState<string>();
	const submit = form.handleSubmit(async (values) => {
		setAlert(undefined);
		try {
			await onSubmit(values);
		} catch (error) {
			const mapped = mapProviderError(error);
			if (mapped.kind === "field" && mapped.field in values)
				form.setError(mapped.field as Path<T>, {
					message: t(mapped.messageKey, { defaultValue: mapped.messageKey }),
				});
			else setAlert(t(mapped.messageKey, { defaultValue: mapped.messageKey }));
		}
	});
	return { alert, submit };
};

const useResetOnOpen = <T extends FieldValues>(
	form: UseFormReturn<T>,
	isOpen: boolean,
	values: T
) => {
	useEffect(() => {
		if (isOpen) form.reset(values);
	}, [form, isOpen, values]);
};

const emptyStorey: StoreyFormValues = {
	name: "",
	number: Number.NaN,
	levelFrom: Number.NaN,
	levelTo: Number.NaN,
	structuralNote: "",
};
const emptyFloorPlan: FloorPlanFormValues = {
	name: "",
	code: "",
	storeyId: "",
	slabLevel: Number.NaN,
	grossArea: Number.NaN,
	structuralGrid: "",
};
const emptyUnit: UnitFormValues = {
	code: "",
	floorPlanId: "",
	usableArea: Number.NaN,
	entryDoor: "",
	roomTags: "",
	boundaryNote: "",
};

export const StoreyDialog = ({
	initialValues,
	isOpen,
	onClose,
	onSubmit,
}: BaseDialogProps<StoreyFormValues>) => {
	const { t } = useTranslation();
	const defaults = initialValues ?? emptyStorey;
	const form = useForm<StoreyFormValues>({
		defaultValues: defaults,
		resolver: zodResolver(
			createStoreySchema({
				required: t("blueprints.validation.required"),
				levelOrder: t("blueprints.validation.levelOrder"),
				nonNegative: t("blueprints.validation.nonNegative"),
			})
		),
	});
	useResetOnOpen(form, isOpen, defaults);
	const submission = useEntitySubmit(form, onSubmit);
	return (
		<DialogShell
			isOpen={isOpen}
			title={t(
				initialValues ? "blueprints.storey.edit" : "blueprints.storey.create"
			)}
			onClose={onClose}
		>
			<form
				noValidate
				className="mt-5 grid gap-4"
				onSubmit={(event) => void submission.submit(event)}
			>
				{submission.alert && <Alert>{submission.alert}</Alert>}
				<TextField
					form={form}
					label={t("blueprints.fields.name")}
					name="name"
				/>
				<NumberField
					form={form}
					label={t("blueprints.fields.number")}
					name="number"
				/>
				<div className="grid gap-4 sm:grid-cols-2">
					<NumberField
						form={form}
						label={t("blueprints.fields.levelFrom")}
						name="levelFrom"
					/>
					<NumberField
						form={form}
						label={t("blueprints.fields.levelTo")}
						name="levelTo"
					/>
				</div>
				<TextField
					form={form}
					label={t("blueprints.fields.structuralNote")}
					name="structuralNote"
				/>
				<FormActions pending={form.formState.isSubmitting} onClose={onClose} />
			</form>
		</DialogShell>
	);
};

export const FloorPlanDialog = ({
	initialValues,
	isOpen,
	onClose,
	onSubmit,
}: BaseDialogProps<FloorPlanFormValues>) => {
	const { t } = useTranslation();
	const defaults = initialValues ?? emptyFloorPlan;
	const form = useForm<FloorPlanFormValues>({
		defaultValues: defaults,
		resolver: zodResolver(
			createFloorPlanSchema({
				required: t("blueprints.validation.required"),
				levelOrder: t("blueprints.validation.levelOrder"),
				nonNegative: t("blueprints.validation.nonNegative"),
			})
		),
	});
	useResetOnOpen(form, isOpen, defaults);
	const submission = useEntitySubmit(form, onSubmit);
	return (
		<DialogShell
			isOpen={isOpen}
			title={t(
				initialValues
					? "blueprints.floorPlan.edit"
					: "blueprints.floorPlan.create"
			)}
			onClose={onClose}
		>
			<form
				noValidate
				className="mt-5 grid gap-4"
				onSubmit={(event) => void submission.submit(event)}
			>
				{submission.alert && <Alert>{submission.alert}</Alert>}
				<TextField
					form={form}
					label={t("blueprints.fields.name")}
					name="name"
				/>
				<TextField
					form={form}
					label={t("blueprints.fields.code")}
					name="code"
				/>
				<TextField
					form={form}
					label={t("blueprints.fields.storey")}
					name="storeyId"
				/>
				<NumberField
					form={form}
					label={t("blueprints.fields.slabLevel")}
					name="slabLevel"
				/>
				<NumberField
					form={form}
					label={t("blueprints.fields.grossArea")}
					name="grossArea"
				/>
				<TextField
					form={form}
					label={t("blueprints.fields.structuralGrid")}
					name="structuralGrid"
				/>
				<FormActions pending={form.formState.isSubmitting} onClose={onClose} />
			</form>
		</DialogShell>
	);
};

export const UnitDialog = ({
	initialValues,
	isOpen,
	onClose,
	onSubmit,
}: BaseDialogProps<UnitFormValues>) => {
	const { t } = useTranslation();
	const defaults = initialValues ?? emptyUnit;
	const form = useForm<UnitFormValues>({
		defaultValues: defaults,
		resolver: zodResolver(
			createUnitSchema({
				required: t("blueprints.validation.required"),
				levelOrder: t("blueprints.validation.levelOrder"),
				nonNegative: t("blueprints.validation.nonNegative"),
			})
		),
	});
	useResetOnOpen(form, isOpen, defaults);
	const submission = useEntitySubmit(form, onSubmit);
	return (
		<DialogShell
			isOpen={isOpen}
			title={t(
				initialValues ? "blueprints.unit.edit" : "blueprints.unit.create"
			)}
			onClose={onClose}
		>
			<form
				noValidate
				className="mt-5 grid gap-4"
				onSubmit={(event) => void submission.submit(event)}
			>
				{submission.alert && <Alert>{submission.alert}</Alert>}
				<TextField
					form={form}
					label={t("blueprints.fields.code")}
					name="code"
				/>
				<TextField
					form={form}
					label={t("blueprints.fields.floorPlan")}
					name="floorPlanId"
				/>
				<NumberField
					form={form}
					label={t("blueprints.fields.usableArea")}
					name="usableArea"
				/>
				<TextField
					form={form}
					label={t("blueprints.fields.entryDoor")}
					name="entryDoor"
				/>
				<TextField
					form={form}
					label={t("blueprints.fields.roomTags")}
					name="roomTags"
				/>
				<TextField
					form={form}
					label={t("blueprints.fields.boundaryNote")}
					name="boundaryNote"
				/>
				<FormActions pending={form.formState.isSubmitting} onClose={onClose} />
			</form>
		</DialogShell>
	);
};
