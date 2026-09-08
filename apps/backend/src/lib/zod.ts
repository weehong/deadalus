import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Teach zod about `.openapi()` metadata.
//
// Under zod 4 this is NOT retroactive: any schema constructed before this call
// runs will lack `.openapi()` forever. Import `z` from this module (never
// straight from "zod") in every module that defines a schema destined for the
// OpenAPI registry — that makes the ordering a module dependency instead of a
// convention someone can accidentally break.
extendZodWithOpenApi(z);

export { z };
