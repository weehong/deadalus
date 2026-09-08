import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "node",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: ["{src,tests}/**/*.{test,spec}.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.d.ts", "src/server.ts"],
		},
	},
});
