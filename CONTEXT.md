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
