# Daedalus

The Unit Matrix platform for construction: contractors track project
progression by unit, and subcontractors record their own progress against it.

## Language

The vocabulary below is the one used in code, interfaces, tests and
documentation. It is seeded from the sibling `daedalus` repository's glossary
and diverges from it in one place, noted under **Project**.

**Sign in**:
The act of a person authenticating into Daedalus, and the screen on which it
happens. An Administrator signs in to the Console with email and password at
`/login`; a Member signs in to the Field with their phone number alone at
`/field/login`. The routes say "login" for brevity; the visible copy says
"Sign in".
_Avoid_: Login, log in, logon, authenticate (as a user-facing verb)

**Sign out**:
The act of an Administrator or a Member deliberately ending their own
Session. The counterpart of Sign in.
_Avoid_: Log out, logout, exit

**Console**:
The part of Daedalus an Administrator uses: every screen they see once they
hold a Session. The Field is not part of it.
_Avoid_: Portal, dashboard, app, admin area, back office

**Field**:
The part of Daedalus a Member uses, on a phone: every screen they see once
they hold a Session. It shows only the Projects, Blocks, Storeys, Units and
Items on which the Member's Subcontractor holds an Assignment, with that
Subcontractor's own Progression at each level, and is where a Member makes
Progress entries. Not part of the Console.
_Avoid_: Site, portal, app, member area, mobile app, subcontractor view

**Administrator**:
A person with an account granting access to Daedalus and authority to manage
project data, assign Items and read progress. The prototype called this role
"staff".
_Avoid_: User, staff, admin user, account holder

**Subcontractor**:
An external company assigned responsibility for Items. It appears once in the
Directory however many Projects it works on, and it has one or more Members.
Its access is limited to the Items explicitly assigned to it. A Subcontractor
never signs in itself; its Members do, into the Field. It cannot be deleted
while it holds an Assignment.
_Avoid_: Vendor, supplier, contractor (as the generic), company (as the term)

**Member**:
A named person who belongs to exactly one Subcontractor, identified by a phone
number, which is how they sign in to the Field. Both the name and the phone
number are required. Members are created and managed by Administrators. A
Member may make Progress entries only on Items assigned to their own
Subcontractor.
_Avoid_: Staff, worker, user, contact person, subcontractor user

**Directory**:
The Console screen listing every Subcontractor. There is one Directory for the
whole of Daedalus; it is not divided by Project.
_Avoid_: Subcontractor list, vendor list

**Session**:
The standing proof that a particular Administrator or Member is signed in.
It is what a guarded screen checks before it will show itself; it outlives a
page reload and ends when it expires or is deliberately ended. An
Administrator's Session is Supabase's, mirrored into a read model; a
Member's is issued by Daedalus itself and lapses if the Member is removed.
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

**QR label**:
The printed sticker fixed to a Unit on site, carrying a QR code that opens
that Unit in the Field. Every Unit has its own; scanning it shows the Member
the Items assigned to their Subcontractor there, after Sign in if needed.
_Avoid_: QR code (as the term for the sticker), tag, sticker, barcode

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

**Item Catalogue**:
The list of Item names defined once per Project, from which Items are put
into Units. It is the Items tab of the Project screen.
_Avoid_: Item list, item master, scope list

**Catalogue Item**:
One entry in a Project's Item Catalogue: a name, unique within the Project
however it is spaced or cased. Applying a Catalogue Item to a set of Units
creates one Item in each Unit that does not already hold one made from it.
Renaming a Catalogue Item renames every Item made from it; it cannot be
deleted while any Unit still holds one.
_Avoid_: Item type, item template, work scope

**Item**:
A piece of furniture, fixture or other installation content required in one
Unit, made from a Catalogue Item. It has a name and a Progression. Each Unit
holds its own Items; the same Catalogue Item in two Units is two Items, each
with its own Progression and its own Assignment. Removing an Item removes
its Progress entries with it, after a confirmation.
_Avoid_: Installation, asset, device, task, checklist

**Progression**:
How far one Item's installation has come, as a whole number from 0 to 100
per cent. It is entered, never derived from tasks; the Progression of an
Item is its latest Progress entry, and 0 if it has none. A Unit, Storey,
Block or Project has a Progression too: the plain average of every Item
beneath it, each Item counting equally, an Item without an Assignment
counting at 0.
_Avoid_: Progress (as the noun for the number), completion, status,
percentage complete

**Progress entry**:
One dated record of an Item's Progression: the value, who entered it and
when. Entries form a history and are never overwritten; a later entry may be
lower than an earlier one. Only an Administrator or a Member of the Item's
assigned Subcontractor may make one, and an Item with no Assignment accepts
none.
_Avoid_: Progress submission, update, report, claim

**Assignment**:
The Administrator's deliberate allocation of one Item to one Subcontractor.
An Item has at most one Assignment at a time. Assignments are made one Item
at a time or in bulk across a chosen set of Units, and may be changed or
removed; doing so leaves the Item's Progress entries and Progression in
place. An Item with no Assignment is visible to Administrators only and
accepts no Progress entry.
_Avoid_: Allocation, scope assignment, automatic assignment
