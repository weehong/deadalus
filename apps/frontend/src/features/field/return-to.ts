/** The Field's Sign in itself: never a destination to return to. */
const SIGN_IN = "/field/login";

/**
 * The return-to destination a scanned label may send a Member to after Sign
 * in. Only a relative Field path survives: a full URL, a protocol-relative
 * host, a Console path, Sign in itself and anything empty are dropped, so a
 * crafted sign-in link cannot send a Member off-site or into the Console.
 * The value is passed to the router as it stands, never parsed further.
 */
export const fieldReturnTo = (value: unknown): string | undefined => {
	if (typeof value !== "string" || !value.startsWith("/field/"))
		return undefined;
	const [pathname] = value.split(/[?#]/);
	return pathname === SIGN_IN ? undefined : value;
};

/**
 * Where a Member being sent to Sign in from the screen they are on should be
 * returned to, if anywhere. The guard and the layout both read it here, so
 * neither can send Sign in back to itself.
 */
export const fieldReturnToHere = (location: {
	pathname: string;
	searchStr: string;
}): string | undefined => fieldReturnTo(location.pathname + location.searchStr);
