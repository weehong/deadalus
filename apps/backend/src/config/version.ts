import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Application version, resolved once at boot from `package.json`. Reading it
 * here (rather than from `npm_package_version` at request time) means the value
 * is correct even when the app is started directly with `node dist/server.js`,
 * where that npm-injected variable is absent.
 */
function resolveVersion(): string {
	try {
		const packageJsonPath = fileURLToPath(
			new URL("../../package.json", import.meta.url)
		);
		const contents = readFileSync(packageJsonPath, "utf8");
		const parsed = JSON.parse(contents) as { version?: string };
		return parsed.version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}

export const APP_VERSION: string = resolveVersion();
