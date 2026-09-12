import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { FunctionComponent } from "@/common/types";
import { FieldHeader } from "@/features/field/FieldHeader";
import { fieldReturnToHere } from "@/features/field/return-to";
import { useMemberQuery } from "@/features/field/useMemberQuery";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/**
 * The guarded Field frame: the header with the Member's identity and Sign
 * out, then the screen in a single column. The route guard keeps visitors
 * out; this component watches the Session end mid-visit (Sign out, or a 401
 * on any Field request) and returns them to Sign in, carrying the screen they
 * were on when the Session lapsed under them, so a scanned label whose Session
 * has expired ends up back on its Unit.
 */
export const FieldLayout = (): FunctionComponent => {
	const navigate = useNavigate();
	const here = useLocation({ select: fieldReturnToHere });
	const session = useMemberSessionStore((state) => state.session);
	const ended = useMemberSessionStore((state) => state.ended);
	const end = useMemberSessionStore((state) => state.end);
	// The last Field screen the Member was actually on, remembered only while
	// the Session lives: by the time it has ended the location is on its way to
	// Sign in, which is no destination to return to.
	const lastReturnTo = useRef(here);
	// Re-read the Member on every visit so a removed Member is signed out.
	useMemberQuery();

	useEffect(() => {
		if (session) lastReturnTo.current = here;
	}, [here, session]);

	// Deliberately not watching the location: the Session ending is the one
	// thing that sends a Member to Sign in, and it does so once.
	useEffect(() => {
		if (!session)
			void navigate({
				to: "/field/login",
				// A Member who signed out is done here, and the phone may be the
				// site's rather than theirs; only a Session that lapsed under them
				// is owed the screen back.
				search: {
					redirect: ended === "expired" ? lastReturnTo.current : undefined,
				},
			});
	}, [ended, navigate, session]);

	if (!session) return null;

	return (
		<div className="min-h-screen bg-canvas">
			<FieldHeader
				memberName={session.member.name}
				subcontractorName={session.member.subcontractor.name}
				onSignOut={() => {
					end("signedOut");
				}}
			/>
			<main className="mx-auto w-full max-w-lg px-4 pt-6 pb-16">
				<Outlet />
			</main>
		</div>
	);
};
