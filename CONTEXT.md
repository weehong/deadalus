# Daedalus Ops

The plant operations console: an administrative web application over work orders,
asset health and incident history for the sites under an organisation's control.

## Language

**Daedalus Ops**:
The product — the operations console itself.
_Avoid_: Meridian Ops (the design prototype's placeholder identity), the dashboard, the admin panel

**Sign in**:
The act of a person authenticating into the console, and the screen on which it happens.
_Avoid_: Login, log in, logon, authenticate (as a user-facing verb)

**Administrator**:
A person with an account granting access to the console. The actor who signs in.
_Avoid_: User, admin user, account holder

**Operator**:
A person who works a production line. A subject of the console's data, not necessarily
someone who can sign in.
_Avoid_: Worker, staff member, employee

**Site**:
One physical plant whose lines, assets and work orders the console reports on.
_Avoid_: Location, facility, plant (as a data term)

**Session**:
The standing proof that a particular Administrator is signed in. It is what a guarded
screen checks before it will show itself; it outlives a page reload and ends when it expires
or is deliberately ended.
_Avoid_: Login state, auth token, cookie

**Provisioning**:
The act of bringing an Administrator's account into existence. It happens outside the console;
an Administrator never creates their own account, and Daedalus Ops offers no sign-up.
_Avoid_: Registration, sign-up, onboarding (as a term for account creation)

**Storey**:
A vertical zone of a Site between two structural levels. The top of the building structure;
it contains Floor plans.
_Avoid_: Level (a level is an elevation in metres, not a storey), floor (as the zone)

**Floor plan**:
One drawn plan within a Storey, the parent of Units; the thing a Drawing describes.
_Avoid_: Layout, sheet (a sheet is the Drawing, not the plan)

**Unit**:
A bounded space on a Floor plan — a tenancy or a group of rooms — in which Installations sit.
_Avoid_: Tenancy, space, room

**Installation**:
A piece of equipment installed in a Unit, with an asset tag and a state.
_Avoid_: Asset (reserved for the asset register), device

**Subcontractor**:
An external company that can be put in charge of Scope items, Unit by Unit.
_Avoid_: Vendor, supplier, contractor (as the generic)

**Scope item**:
One of a fixed, lettered list of trades (A–F) that a Subcontractor can be in charge of on a
Unit.
_Avoid_: Task, work item, trade (as the data term)

**Drawing**:
An architect's file (PDF, DWG, DXF, RVT) uploaded against a Site and optionally linked to a
Floor plan.
_Avoid_: Blueprint (as a data term — "Blueprints" is the section's name), document, file
