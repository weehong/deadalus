import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { QrLabelSheet, QrSheetStyles } from "@/features/projects/QrLabelSheet";
import { qrLabelBlocks } from "@/features/projects/qr-labels";
import { useProjectQuery } from "@/features/projects/useProjectQuery";

/**
 * The print-ready QR label page: one Block's labels or the whole Project's,
 * laid out as A4 sheets of Avery L7160 stock and sent to paper or PDF with
 * the browser's own Print. It carries no Console chrome, so nothing but
 * labels reaches the paper, and the controls above the sheets are hidden in
 * print. Each code is built from the Unit's id and this browser's origin, so
 * only labels printed from the deployed Console are usable on site
 * (ADR-0010).
 */
export const ProjectQrLabelsPage = ({
	id,
	blockId,
}: {
	id: string;
	/** The one Block to print; every Block of the Project without it. */
	blockId?: string;
}): React.ReactElement => {
	const { t } = useTranslation();
	const query = useProjectQuery(id);
	const project = query.data;
	const blocks = project
		? qrLabelBlocks(project, window.location.origin, blockId)
		: [];
	const count = blocks.reduce((total, block) => total + block.units.length, 0);
	// A Block that is not in this Project is as absent as a Project that is gone.
	const notFound =
		(query.error instanceof ApiRequestError && query.error.status === 404) ||
		(project !== undefined && blockId !== undefined && blocks.length === 0);

	const controls = (): React.ReactNode => {
		if (query.isPending)
			return <p role="status">{t("projects.detail.loading")}</p>;
		if (notFound)
			return (
				<>
					<PageHeader heading={t("projects.qrLabels.notFound")} />
					<p>{t("projects.qrLabels.notFoundBody")}</p>
				</>
			);
		if (query.isError)
			return (
				<Alert>
					<p>{t("projects.detail.error")}</p>
					<Button
						pending={query.isFetching}
						variant="secondary"
						onClick={(): void => {
							void query.refetch();
						}}
					>
						{t("projects.retry")}
					</Button>
				</Alert>
			);
		const block = blocks[0];
		return (
			<>
				<PageHeader
					kicker={query.data.code}
					actions={
						count > 0 ? (
							<Button
								onClick={(): void => {
									window.print();
								}}
							>
								{t("projects.qrLabels.print")}
							</Button>
						) : undefined
					}
					heading={
						blockId && block
							? t("projects.qrLabels.headingBlock", {
									name: query.data.name,
									block: block.name,
								})
							: query.data.name
					}
				/>
				<p className="m-0">
					{count > 0
						? t("projects.qrLabels.count", { count })
						: t("projects.qrLabels.empty")}
				</p>
			</>
		);
	};

	return (
		// The page's own landmark: there is no Console shell around it to give
		// it one, and the header above the sheets must not read as a banner.
		<main className="min-h-screen bg-canvas">
			<QrSheetStyles />
			<div className="qr-print-hidden mx-auto w-full max-w-[210mm] px-4 pt-8 pb-6">
				<Link
					className="mb-4 inline-block text-sm underline"
					params={{ id }}
					search={blockId ? { block: blockId } : {}}
					to="/projects/$id"
				>
					{t("projects.qrLabels.back")}
				</Link>
				{controls()}
			</div>
			{project && count > 0 && (
				<div className="pb-8 print:pb-0">
					{blocks.map((block) => (
						<QrLabelSheet
							key={block.id}
							blockName={block.name}
							projectCode={project.code}
							units={block.units}
						/>
					))}
				</div>
			)}
		</main>
	);
};
