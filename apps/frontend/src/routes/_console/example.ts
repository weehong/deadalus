import { createFileRoute } from "@tanstack/react-router";
import { ExamplePage } from "@/features/example/ExamplePage";

export const Route = createFileRoute("/_console/example")({
	component: ExamplePage,
});
