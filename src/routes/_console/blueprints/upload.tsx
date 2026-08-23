import { createFileRoute } from "@tanstack/react-router";
import { UploadDrawingsScreen } from "@/features/blueprints/upload/UploadDrawingsScreen";
import { useBlueprintSite } from "@/features/blueprints/BlueprintSiteContext";
const UploadPage = () => {
	const site = useBlueprintSite();
	return <UploadDrawingsScreen siteId={site?.id} siteName={site?.name} />;
};
export const Route = createFileRoute("/_console/blueprints/upload")({
	component: UploadPage,
});
