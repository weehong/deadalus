import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { CatalogueItemInput } from "@/features/projects/catalogueItemsApi";
import type { CatalogueItem } from "@/features/projects/types";

const schema = z.object({
	name: z.string().trim().min(1, "nameRequired").max(60, "nameTooLong"),
});
export interface CatalogueItemFailure {
	field?: "name";
	message: string;
}
/** Adds a Catalogue Item, or renames one when `catalogueItem` is given. */
export const CatalogueItemForm = ({
	catalogueItem,
	pending = false,
	onSubmit,
	onCancel,
}: {
	catalogueItem?: CatalogueItem;
	pending?: boolean;
	onSubmit: (
		values: CatalogueItemInput
	) => Promise<CatalogueItemFailure | void>;
	onCancel?: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const id = useId();
	const [failure, setFailure] = useState<string>();
	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { name: catalogueItem?.name ?? "" },
	});
	const busy = pending || isSubmitting;
	const submit = async (values: z.infer<typeof schema>): Promise<void> => {
		if (busy) return;
		setFailure(undefined);
		const result = await onSubmit({ name: values.name });
		if (result?.field)
			setError(
				result.field,
				{ type: "server", message: result.message },
				{ shouldFocus: true }
			);
		else if (result) setFailure(result.message);
		else if (!catalogueItem) reset();
	};
	return (
		<form
			noValidate
			className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]"
			aria-label={t(
				catalogueItem ? "projects.items.rename" : "projects.items.add"
			)}
			onSubmit={(event) => void handleSubmit(submit)(event)}
		>
			{failure && (
				<div className="sm:col-span-2">
					<Alert>{failure}</Alert>
				</div>
			)}
			<Field
				id={`${id}-name`}
				label={t("projects.items.name")}
				error={
					errors.name
						? errors.name.type === "server"
							? errors.name.message
							: t(
									errors.name.message === "nameTooLong"
										? "projects.items.nameTooLong"
										: "projects.items.nameRequired"
								)
						: undefined
				}
			>
				<Input
					required
					autoComplete="off"
					disabled={busy}
					{...register("name")}
				/>
			</Field>
			<div className="flex flex-wrap items-end gap-2">
				<Button pending={busy} type="submit">
					{t(
						busy
							? "projects.items.saving"
							: catalogueItem
								? "projects.items.save"
								: "projects.items.add"
					)}
				</Button>
				{onCancel && (
					<Button disabled={busy} variant="secondary" onClick={onCancel}>
						{t("projects.items.cancel")}
					</Button>
				)}
			</div>
		</form>
	);
};
