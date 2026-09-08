import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { APP_VERSION } from "@/config/version.js";
import { registry } from "@/openapi/registry.js";

/** Build the OpenAPI 3.0 document from the registered zod schemas and paths. */
export function buildOpenApiDocument(): ReturnType<
	OpenApiGeneratorV3["generateDocument"]
> {
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version: APP_VERSION,
			title: "Daedalus API",
			description:
				"Daedalus — Unit Matrix platform for construction: contractors track project progression by unit, and subcontractors record their own progress against it.",
		},
		servers: [{ url: "/" }],
	});
}
