# Daedalus

The Unit Matrix platform for construction: contractors track project
progression by unit, and subcontractors record their own progress against it.

## Language

The vocabulary below is the one used in code, interfaces, tests and
documentation. It is seeded from the sibling `daedalus` repository's glossary
and diverges from it in one place, noted under **Project**.

**Sign in**:
The act of a person authenticating into Daedalus, and the screen on which it
happens. The route is `/login` for brevity; the visible copy says "Sign in".
_Avoid_: Login, log in, logon, authenticate (as a user-facing verb)

**Administrator**:
A person with an account granting access to Daedalus and authority to manage
project data, assign Items and read progress. The prototype called this role
"staff".
_Avoid_: User, staff, admin user, account holder

**Subcontractor**:
An external company assigned responsibility for Items. Its access is limited to
the Items explicitly assigned to it. Subcontractors do not sign in on the
Administrator screen; their access flow is not yet built.
_Avoid_: Vendor, supplier, contractor (as the generic)

**Session**:
The standing proof that a particular Administrator is signed in. It is what a
guarded screen checks before it will show itself; it outlives a page reload and
ends when it expires or is deliberately ended. Supabase owns it; the
application mirrors it into a read model.
_Avoid_: Login state, auth token, cookie

**Provisioning**:
The act of bringing an Administrator's account into existence. It happens in
the Supabase dashboard; an Administrator never creates their own account, and
Daedalus offers no sign-up.
_Avoid_: Registration, sign-up, onboarding (as a term for account creation)

**Project**:
One development whose building structure, Units, Items and Subcontractors
Daedalus manages. The top of the hierarchy. The sibling `daedalus` repository
calls this a **Site** and forbids "project"; this repository follows the
prototype, its README and its package descriptions instead.
_Avoid_: Site, location, facility

**Block**:
One building within a Project, lettered A, B, C. It contains Storeys.

**Storey**:
One horizontal level of a Block, labelled G, 01, 02. It contains Units.
_Avoid_: Level, floor

**Unit**:
A bounded space on a Storey — a flat or a group of rooms — with its own Items
and progress records. The thing a QR label identifies.
_Avoid_: Tenancy, space, room

**Item**:
A piece of furniture, fixture or other installation content required in one
Unit, with a checklist of tasks. Progress is derived from the tasks ticked.
_Avoid_: Installation, asset, device, task (an Item has tasks)

**Assignment**:
The Administrator's deliberate allocation of one Item to one Subcontractor.
