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

**Sign out**:
The act of an Administrator deliberately ending their own Session. The
counterpart of Sign in.
_Avoid_: Log out, logout, exit

**Console**:
The whole of Daedalus that sits behind Sign in: every screen an Administrator
sees once they hold a Session. The screens a Member will use are not part of
it.
_Avoid_: Portal, dashboard, app, admin area, back office

**Administrator**:
A person with an account granting access to Daedalus and authority to manage
project data, assign Items and read progress. The prototype called this role
"staff".
_Avoid_: User, staff, admin user, account holder

**Subcontractor**:
An external company assigned responsibility for Items. It appears once in the
Directory however many Projects it works on, and it has one or more Members.
Its access is limited to the Items explicitly assigned to it. A Subcontractor
never signs in itself; its Members will, through a flow that is not yet built.
_Avoid_: Vendor, supplier, contractor (as the generic), company (as the term)

**Member**:
A named person who belongs to exactly one Subcontractor, identified by a phone
number, which is how they will sign in. Both the name and the phone number are
required. Members are created and managed by Administrators.
_Avoid_: Staff, worker, user, contact person, subcontractor user

**Directory**:
The Console screen listing every Subcontractor. There is one Directory for the
whole of Daedalus; it is not divided by Project.
_Avoid_: Subcontractor list, vendor list

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
One development whose Structure, Units and Items Daedalus manages, and on
which Subcontractors are given work through Assignments. The top of the
hierarchy. It has a name and a short code (EG2, KLW), each unique across
Daedalus. A Project does not own its Subcontractors; they live in the
Directory. The sibling `daedalus` repository calls this a **Site**, forbids
"project", and scopes each subcontractor to one site; this repository follows
the prototype, its README and its package descriptions instead.
_Avoid_: Site, location, facility

**Structure**:
The Blocks, Storeys and Units of one Project, and the Console tab on which an
Administrator sets them out. Every Storey belongs to exactly one Block and
every Unit to exactly one Storey; nothing is shared across Blocks.
_Avoid_: Tree, hierarchy (as a term), building structure, blueprint

**Block**:
One building within a Project, named as the developer names it: A, B, C on
one schedule, Block 1 or 1 Tampines Street 62 (Tower 3) on another. It
contains Storeys, and each Block has its own Storeys; two Blocks of one
Project may have different numbers of them.
_Avoid_: Tower (as the term), building (as the term)

**Storey**:
One horizontal level of a Block, labelled G, 01, 02. In a Unit Matrix, a
numeric label is padded to two digits; a label with letters (G, B1, M) stays
as written. Storeys taken from a schedule stand lowest first, whichever way
it prints them. Manually named Storeys keep their chosen names and order.
A Storey contains Units.
_Avoid_: Level, floor

**Unit**:
A bounded space on a Storey — a flat or a group of rooms — with its own Items
and progress records. The thing a QR label identifies. A Unit is named by its
Stack number when taken from a Unit Matrix, padded to two digits (01, 02,
114); manually named Units keep their chosen names. Its full label (#12-01) is
composed from its Storey and its name for display, never parsed. A Unit may
be of one Unit Type.
_Avoid_: Tenancy, space, room, apartment number (as the term)

**Stack**:
The vertical run of Units that share a unit number across the Storeys of one
Block: every 01 in Block A. Stacks are the columns of a Unit Matrix and give
Units their names. A Stack is not a persisted thing; it is a name Units share.
_Avoid_: Column, line, unit number (as the term)

**Unit Matrix**:
The grid that sets out one Block: Storeys as rows, Stacks as columns, and in
each cell the Unit Type code of the Unit there, or nothing where no Unit
exists. A cell that spans two Stacks is one Unit, named by the first. The
developer's schedule arrives as a workbook holding one Unit Matrix per Block,
and uploading that workbook is how an Administrator sets out a whole Project's
Structure in one go; a Storey the schedule shows with no Units is not part of
the Structure.
_Avoid_: Unit schedule, unit mix (that is the table of counts), grid (as the
term), matrix (unqualified)

**Unit Type**:
A category of Unit defined once per Project and shared by every Unit of that
kind in it, identified by a short code (AS1, BP2(p) (M), CP7) and optionally
described in words (1 Bedroom + Study, 2 Bedroom Premium). A qualifier the
developer writes on a cell, such as (p), (M), (d) or -PH, is part of the code,
not a separate attribute. The count of Units of a type is derived from the
Units, never entered.
_Avoid_: Layout, model, plan type, unit mix (that is the table of counts)

**Item**:
A piece of furniture, fixture or other installation content required in one
Unit, with a checklist of tasks. Progress is derived from the tasks ticked.
_Avoid_: Installation, asset, device, task (an Item has tasks)

**Assignment**:
The Administrator's deliberate allocation of one Item to one Subcontractor.
